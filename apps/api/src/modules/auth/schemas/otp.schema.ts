import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * One document per phone. Holds the current code (HMAC-hashed, never plain) and
 * the send-rate window. The whole document is removed by a TTL index when the
 * window ends; codeExpiresAt is checked in code (TTL deletion lags up to ~60s).
 */
@Schema({ timestamps: true })
export class Otp {
  @Prop({ type: String, required: true, unique: true }) phone: string;
  @Prop({ type: String, required: true }) codeHash: string;
  @Prop({ type: Date, required: true }) codeExpiresAt: Date;
  @Prop({ type: Number, default: 0 }) attempts: number;
  @Prop({ type: Number, default: 0 }) sendCount: number;
  @Prop({ type: Date, required: true }) lastSentAt: Date;
  @Prop({ type: Date, required: true }) expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
