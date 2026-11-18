import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

@Schema()
export class Address {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 60 }) title: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 100 }) receiver: string;
  @Prop({ type: String, required: true, trim: true }) phone: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 60 }) province: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 60 }) city: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 500 }) address: string;
  @Prop({ type: String, required: true, trim: true }) postalCode: string;
  @Prop({ type: Boolean, default: false }) isDefault: boolean;
}
export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, unique: true, sparse: true, trim: true }) phone?: string;
  @Prop({ type: String, unique: true, sparse: true, lowercase: true, trim: true }) email?: string;
  @Prop({ type: String, select: false }) passwordHash?: string;

  @Prop({ type: String, trim: true, maxlength: 50 }) firstName?: string;
  @Prop({ type: String, trim: true, maxlength: 50 }) lastName?: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.Customer }) role: Role;
  @Prop({ type: [AddressSchema], default: [] }) addresses: Address[];

  @Prop({ type: Boolean, default: false }) isPhoneVerified: boolean;
  @Prop({ type: Boolean, default: false }) isEmailVerified: boolean;
  @Prop({ type: Boolean, default: true }) isActive: boolean;

  @Prop({ type: Number, default: 0 }) failedLoginAttempts: number;
  @Prop({ type: Date }) lockUntil?: Date;
  /** Incremented to invalidate every access/refresh token of this user. */
  @Prop({ type: Number, default: 0 }) tokenVersion: number;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
