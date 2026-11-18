import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

/** One refresh token = one session document. Only a SHA-256 hash of the secret is stored. */
@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true, index: true })
  user: Types.ObjectId;

  /** All tokens descended from one login share a family (used for reuse detection). */
  @Prop({ type: String, required: true, index: true }) family: string;
  @Prop({ type: String, required: true }) tokenHash: string;
  /** user.tokenVersion when the session was created. */
  @Prop({ type: Number, required: true }) tv: number;
  @Prop({ type: Date, required: true }) expiresAt: Date;
  @Prop({ type: Date, default: null }) revokedAt?: Date | null;
  @Prop({ type: String }) ip?: string;
  @Prop({ type: String }) userAgent?: string;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
