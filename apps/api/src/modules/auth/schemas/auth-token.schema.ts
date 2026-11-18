import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

export type AuthTokenType = 'email_verify' | 'password_reset';

/** Single-use tokens sent by e-mail. Only the SHA-256 hash is stored. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuthToken {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true }) user: Types.ObjectId;
  @Prop({ type: String, enum: ['email_verify', 'password_reset'], required: true }) type: AuthTokenType;
  @Prop({ type: String, required: true, unique: true }) tokenHash: string;
  @Prop({ type: Date, required: true }) expiresAt: Date;
  @Prop({ type: Date, default: null }) usedAt?: Date | null;
}
export const AuthTokenSchema = SchemaFactory.createForClass(AuthToken);
AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
