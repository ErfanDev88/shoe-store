import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { AuthToken, AuthTokenType } from './schemas/auth-token.schema';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class AccountTokensService {
  constructor(@InjectModel(AuthToken.name) private readonly model: Model<AuthToken>) {}

  /** Returns the raw token (to be e-mailed). Older unused tokens of the same type are invalidated. */
  async issue(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
    await this.model.updateMany({ user: userId, type, usedAt: null }, { $set: { usedAt: new Date() } });
    const raw = randomBytes(32).toString('hex');
    await this.model.create({ user: userId, type, tokenHash: sha(raw), expiresAt: new Date(Date.now() + ttlMs) });
    return raw;
  }

  async issuedRecently(userId: string, type: AuthTokenType, withinMs: number) {
    return !!(await this.model.exists({ user: userId, type, createdAt: { $gt: new Date(Date.now() - withinMs) } }));
  }

  /** Atomically marks the token as used; returns the user id, or null if invalid/expired/already used. */
  async consume(raw: string, type: AuthTokenType): Promise<string | null> {
    const doc = await this.model.findOneAndUpdate(
      { tokenHash: sha(raw), type, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
    );
    return doc ? String(doc.user) : null;
  }
}
