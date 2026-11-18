import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { AccessPayload } from '../../common/types/auth.types';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RefreshSession } from './schemas/refresh-session.schema';

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

const ISSUER = 'shoe-store-api';

@Injectable()
export class TokensService {
  private readonly accessSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    config: ConfigService,
    @InjectModel(RefreshSession.name) private readonly sessions: Model<RefreshSession>,
  ) {
    this.accessSecret = config.get<string>('JWT_ACCESS_SECRET')!;
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL')!;
    this.refreshTtlMs = config.get<number>('REFRESH_TTL_DAYS')! * 24 * 60 * 60 * 1000;
  }

  // ---------- access token (short-lived JWT, sent in the Authorization header) ----------
  signAccessToken(user: UserDocument): Promise<string> {
    const payload: AccessPayload = { sub: user.id, role: user.role, tv: user.tokenVersion };
    return this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
      algorithm: 'HS256',
      issuer: ISSUER,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessPayload> {
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.accessSecret,
        algorithms: ['HS256'],
        issuer: ISSUER,
      });
      if (!payload.sub || typeof payload.tv !== 'number') throw new Error('malformed');
      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }

  // ---------- refresh token (opaque, httpOnly cookie, rotated on every use) ----------
  private hash(secret: string) {
    return createHash('sha256').update(secret).digest('hex');
  }
  private safeEqual(a: string, b: string) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  }
  private parse(token: string): { id: string; secret: string } | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [id, secret] = parts;
    if (!/^[a-f\d]{24}$/i.test(id) || !/^[a-f\d]{64}$/i.test(secret)) return null;
    return { id, secret };
  }

  async createSession(user: UserDocument, meta: SessionMeta, family: string = randomUUID()) {
    const secret = randomBytes(32).toString('hex');
    const session = await this.sessions.create({
      user: user._id,
      family,
      tokenHash: this.hash(secret),
      tv: user.tokenVersion,
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return `${session.id}.${secret}`;
  }

  /**
   * Exchanges a refresh token for a new pair. The old token is revoked.
   * If an already-used token shows up again (theft/replay), the whole family is revoked.
   */
  async rotate(token: string, meta: SessionMeta) {
    const parsed = this.parse(token);
    if (!parsed) throw new UnauthorizedException();

    const session = await this.sessions.findById(parsed.id).exec();
    if (!session || !this.safeEqual(this.hash(parsed.secret), session.tokenHash)) {
      throw new UnauthorizedException();
    }
    if (session.revokedAt) {
      await this.revokeFamily(session.family); // reuse detected
      throw new UnauthorizedException();
    }
    if (session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException();

    const user = await this.users.findById(String(session.user));
    if (!user || !user.isActive || user.tokenVersion !== session.tv) {
      await this.revokeFamily(session.family);
      throw new UnauthorizedException();
    }

    // claim the token atomically; a concurrent request using the same token loses
    const claimed = await this.sessions
      .findOneAndUpdate({ _id: session._id, revokedAt: null }, { $set: { revokedAt: new Date() } })
      .exec();
    if (!claimed) throw new UnauthorizedException();

    const refreshToken = await this.createSession(user, meta, session.family);
    const accessToken = await this.signAccessToken(user);
    return { user, accessToken, refreshToken };
  }

  async revokeByToken(token: string) {
    const parsed = this.parse(token);
    if (!parsed) return;
    const session = await this.sessions.findById(parsed.id).exec();
    if (session && this.safeEqual(this.hash(parsed.secret), session.tokenHash)) {
      await this.revokeFamily(session.family);
    }
  }

  async revokeAllForUser(userId: string) {
    await this.users.bumpTokenVersion(userId); // kills access tokens too
    await this.sessions.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }

  private async revokeFamily(family: string) {
    await this.sessions.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
}
