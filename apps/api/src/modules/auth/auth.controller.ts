import { Body, Controller, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, RequestOtpDto, ResetPasswordDto, VerifyEmailDto, VerifyOtpDto } from './dto/auth.dto';
import { SessionMeta } from './tokens.service';

const REFRESH_COOKIE = 'rt';

@Controller('auth')
export class AuthController {
  private readonly isProd: boolean;
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
    this.refreshMaxAgeMs = config.get<number>('REFRESH_TTL_DAYS')! * 24 * 60 * 60 * 1000;
  }

  // ----- OTP -----
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.auth.verifyOtp(dto.phone, dto.code, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  // ----- email + password -----
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.auth.register(dto, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.auth.login(dto, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  // ----- sessions -----
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.cookieToken(req);
    if (!token) throw new UnauthorizedException();
    try {
      const { refreshToken, ...result } = await this.auth.refresh(token, this.meta(req));
      this.setRefreshCookie(res, refreshToken);
      return result;
    } catch (e) {
      this.clearRefreshCookie(res);
      throw e;
    }
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.cookieToken(req);
    if (token) await this.auth.logout(token);
    this.clearRefreshCookie(res);
    return { message: 'LOGGED_OUT' };
  }

  @HttpCode(200)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    this.clearRefreshCookie(res);
    return { message: 'LOGGED_OUT_EVERYWHERE' };
  }

  // ----- e-mail verification / passwords -----
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('email/verify')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  @Post('email/resend')
  async resendEmail(@CurrentUser() user: AuthUser) {
    await this.auth.sendEmailVerification(user.id);
    return { message: 'VERIFICATION_EMAIL_SENT' };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/forgot')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/reset')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/change')
  async change(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  // ----- helpers -----
  private meta(req: Request): SessionMeta {
    return { ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 200) };
  }

  private cookieToken(req: Request): string | undefined {
    const value = req.cookies?.[REFRESH_COOKIE];
    return typeof value === 'string' ? value : undefined;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'strict',
      path: '/api/auth', // the cookie is only ever sent to auth endpoints
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, { ...this.cookieOptions(), maxAge: this.refreshMaxAgeMs });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }
}
