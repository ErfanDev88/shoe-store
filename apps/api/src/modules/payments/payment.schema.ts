import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'needs_refund'] as const;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true, index: true }) order: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) user: Types.ObjectId;
  @Prop({ type: String, default: 'zarinpal' }) gateway: string;
  @Prop({ type: String, required: true, unique: true }) authority: string;
  @Prop({ type: Number, required: true }) amount: number; // Toman, copied from the order at request time
  @Prop({ type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true }) status: (typeof PAYMENT_STATUSES)[number];
  @Prop({ type: String }) refId?: string;
  @Prop({ type: String }) cardPan?: string;
  @Prop({ type: Date }) verifiedAt?: Date;
}
export const PaymentSchema = SchemaFactory.createForClass(Payment);
