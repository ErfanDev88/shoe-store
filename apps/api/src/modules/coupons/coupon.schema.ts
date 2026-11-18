import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true }) code: string;
  @Prop({ type: String, enum: ['percent', 'fixed'], required: true }) type: 'percent' | 'fixed';
  @Prop({ type: Number, required: true, min: 1 }) value: number;
  @Prop({ type: Number, default: 0 }) minOrder: number;
  @Prop({ type: Number }) maxDiscount?: number;
  @Prop({ type: Number }) usageLimit?: number;
  @Prop({ type: Number, default: 0 }) usedCount: number;
  @Prop({ type: Number }) perUserLimit?: number;
  @Prop({ type: Date }) startsAt?: Date;
  @Prop({ type: Date }) expiresAt?: Date;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
}
export const CouponSchema = SchemaFactory.createForClass(Coupon);
