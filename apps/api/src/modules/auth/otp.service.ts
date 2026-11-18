import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { Otp } from './schemas/otp.schema';

const CODE_TTL_MS = 2 * 60 * 1000; // code valid for 2 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // at least 60s between sends
const WINDOW_MS = 60 * 60 * 1000; // rate window: 1 hour
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5; // wrong guesses per code

@Injectable()
export class OtpService {
  readonly codeTtlSeconds = CODE_TTL_MS / 1000;
  private readonly secret: string;

  constructor(
    @InjectModel(Otp.name) private readonly model: Model<Otp>,
    config: ConfigService,
  ) {
    this.secret = config.get<string>('OTP_HMAC_SECRET')!;
  }

  // HMAC (keyed) instead of a bare hash: a 6-digit code can't be brute-forced offline from a DB leak
  private hash(phone: string, code: string) {
    return createHmac('sha256', this.secret).update(`${phone}:${code}`).digest('hex');
  }

  /** Creates a new code for the phone (enforcing cooldown + hourly limit) and returns it. */
  async issue(phone: string): Promise<string> {
    const now = Date.now();
    const existing = await this.model.findOne({ phone }).exec();
    const windowActive = !!existing && existing.expiresAt.getTime() > now;

    if (existing && windowActive) {
      if (now - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
        throw new HttpException('OTP_TOO_SOON', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (existing.sendCount >= MAX_SENDS_PER_WINDOW) {
        throw new HttpException('OTP_LIMIT_REACHED', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const code = randomInt(100000, 1000000).toString();
    const fields = {
      codeHash: this.hash(phone, code),
      codeExpiresAt: new Date(now + CODE_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(now),
    };

    if (existing && windowActive) {
      await this.model.updateOne({ phone }, { $set: fields, $inc: { sendCount: 1 } });
    } else {
      await this.model.updateOne(
        { phone },
        { $set: { ...fields, sendCount: 1, expiresAt: new Date(now + WINDOW_MS) } },
        { upsert: true },
      );
    }
    return code;
  }

  /** Throws unless the code is correct, unexpired and unused. A code works exactly once. */
  async verify(phone: string, code: string): Promise<void> {
    const invalid = () => new BadRequestException('OTP_INVALID_OR_EXPIRED');
    const now = new Date();

    // atomically count this attempt; refuses once MAX_ATTEMPTS is reached
    const doc = await this.model
      .findOneAndUpdate(
        { phone, attempts: { $lt: MAX_ATTEMPTS }, codeExpiresAt: { $gt: now } },
        { $inc: { attempts: 1 } },
        { new: true },
      )
      .exec();
    if (!doc) throw invalid();

    const expected = Buffer.from(doc.codeHash);
    const actual = Buffer.from(this.hash(phone, code));
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw invalid();

    // consume the code atomically (prevents double use under concurrent requests)
    const consumed = await this.model.updateOne(
      { phone, codeHash: doc.codeHash, codeExpiresAt: { $gt: now } },
      { $set: { codeExpiresAt: new Date(0) } },
    );
    if (consumed.modifiedCount !== 1) throw invalid();
  }
}
