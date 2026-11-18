import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsProvider } from '../notifications/sms/sms.provider';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AccountTokensService } from './account-tokens.service';
import { OtpService } from './otp.service';
import { SessionMeta, TokensService } from './tokens.service';

const isDuplicateKey = (e: unknown) => (e as { code?: number })?.code === 11000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokensService,
    private readonly otp: OtpService,
    private readonly sms: SmsProvider,
    private readonly accountTokens: AccountTokensService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------- OTP (login and registration are the same flow) ----------
  async requestOtp(phone: string) {
    const code = await this.otp.issue(phone);
    try {
      await this.sms.sendOtp(phone, code);
    } catch (err) {
      this.logger.error(`SMS send failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('SMS_SEND_FAILED');
    }
    // identical response whether or not the phone has an account (no user enumeration)
    return { message: 'OTP_SENT', expiresInSeconds: this.otp.codeTtlSeconds };
  }

  async verifyOtp(phone: string, code: string, meta: SessionMeta) {
    await this.otp.verify(phone, code);

    let user = await this.users.findByPhone(phone);
    if (!user) {
      try {
        user = await this.users.createWithPhone(phone);
      } catch (e) {
        if (!isDuplicateKey(e)) throw e;
        user = await this.users.findByPhone(phone); // created by a concurrent request
      }
    }
    if (!user) throw new UnauthorizedException();
    if (!user.isActive) throw new ForbiddenException('ACCOUNT_DISABLED');
    if (!user.isPhoneVerified) user = (await this.users.markPhoneVerified(user.id)) ?? user;

    return this.issueLogin(user, meta);
  }

  // ---------- email + password ----------
  async register(dto: RegisterDto, meta: SessionMeta) {
    if (await this.users.emailExists(dto.email)) throw new ConflictException('EMAIL_TAKEN');
    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.users.createWithEmail({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      this.sendEmailVerification(user.id).catch(() => undefined);
      return this.issueLogin(user, meta);
    } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('EMAIL_TAKEN');
      throw e;
    }
  }

  async login(dto: LoginDto, meta: SessionMeta) {
    const user = await this.users.findByEmailWithPassword(dto.email);

    // always run one argon2 verification so response time doesn't reveal whether the email exists
    const valid = await verifyPassword(user?.passwordHash ?? (await this.getDummyHash()), dto.password);
    const locked = !!user?.lockUntil && user.lockUntil.getTime() > Date.now();

    if (!user || !user.passwordHash || locked || !valid) {
      if (user && !locked) await this.users.registerFailedLogin(user.id);
      throw new UnauthorizedException('INVALID_CREDENTIALS'); // same answer for every failure
    }
    if (!user.isActive) throw new ForbiddenException('ACCOUNT_DISABLED');

    await this.users.resetLoginFailures(user.id);
    return this.issueLogin(user, meta);
  }

  // ---------- e-mail verification / password reset / change ----------
  async sendEmailVerification(userId: string) {
    const user = await this.users.findById(userId);
    if (!user?.email || user.isEmailVerified) return;
    if (await this.accountTokens.issuedRecently(userId, 'email_verify', 60_000)) return;
    const raw = await this.accountTokens.issue(userId, 'email_verify', 24 * 60 * 60 * 1000);
    await this.notifications.email(user.email, 'تأیید ایمیل', 'برای تأیید ایمیل خود روی دکمه‌ی زیر بزنید. این لینک ۲۴ ساعت اعتبار دارد.', {
      url: `${this.notifications.frontendUrl}/verify-email?token=${raw}`,
      label: 'تأیید ایمیل',
    });
  }

  async verifyEmail(token: string) {
    const userId = await this.accountTokens.consume(token, 'email_verify');
    if (!userId) throw new BadRequestException('TOKEN_INVALID_OR_EXPIRED');
    await this.users.markEmailVerified(userId);
    return { message: 'EMAIL_VERIFIED' };
  }

  /** Always answers the same, whether or not the e-mail exists. */
  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (user?.isActive && !(await this.accountTokens.issuedRecently(user.id, 'password_reset', 60_000))) {
      const raw = await this.accountTokens.issue(user.id, 'password_reset', 30 * 60 * 1000);
      await this.notifications.email(email, 'بازیابی رمز عبور', 'برای تعیین رمز جدید روی دکمه‌ی زیر بزنید. این لینک ۳۰ دقیقه اعتبار دارد. اگر شما درخواست نداده‌اید این ایمیل را نادیده بگیرید.', {
        url: `${this.notifications.frontendUrl}/reset-password?token=${raw}`,
        label: 'تعیین رمز جدید',
      });
    }
    return { message: 'RESET_EMAIL_SENT_IF_ACCOUNT_EXISTS' };
  }

  async resetPassword(token: string, password: string) {
    const userId = await this.accountTokens.consume(token, 'password_reset');
    if (!userId) throw new BadRequestException('TOKEN_INVALID_OR_EXPIRED');
    await this.users.setPassword(userId, await hashPassword(password));
    await this.tokens.revokeAllForUser(userId); // logs the account out everywhere
    return { message: 'PASSWORD_UPDATED' };
  }

  async changePassword(userId: string, current: string, next: string, meta: SessionMeta) {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user?.passwordHash) throw new BadRequestException('NO_PASSWORD_SET');
    if (!(await verifyPassword(user.passwordHash, current))) throw new UnauthorizedException('INVALID_CREDENTIALS');
    await this.users.setPassword(userId, await hashPassword(next));
    await this.tokens.revokeAllForUser(userId);
    const fresh = await this.users.findById(userId);
    if (!fresh) throw new UnauthorizedException();
    return this.issueLogin(fresh, meta); // keep this device logged in with a fresh session
  }

  // ---------- session management ----------
  async refresh(token: string, meta: SessionMeta) {
    const { user, accessToken, refreshToken } = await this.tokens.rotate(token, meta);
    return { accessToken, refreshToken, user: this.users.toPublic(user) };
  }

  logout(token: string) {
    return this.tokens.revokeByToken(token);
  }

  logoutAll(userId: string) {
    return this.tokens.revokeAllForUser(userId);
  }

  // ---------- helpers ----------
  private async issueLogin(user: UserDocument, meta: SessionMeta) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken(user),
      this.tokens.createSession(user, meta),
    ]);
    return { accessToken, refreshToken, user: this.users.toPublic(user) };
  }

  private getDummyHash() {
    this.dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
    return this.dummyHash;
  }
}
