import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { Localized, LocalizedSchema } from '../../../common/schemas/localized.schema';

export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const SHIPPING_METHODS = ['pishtaz', 'tipax'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true }) product: Types.ObjectId;
  @Prop({ type: String, required: true }) sku: string;
  @Prop({ type: LocalizedSchema, required: true }) title: Localized;
  @Prop({ type: String }) slug?: string;
  @Prop({ type: String }) image?: string;
  @Prop({ type: Number, required: true }) size: number;
  @Prop({ type: LocalizedSchema, required: true }) colorName: Localized;
  @Prop({ type: String, required: true }) colorHex: string;
  @Prop({ type: Number, required: true }) price: number; // unit price snapshot (Toman)
  @Prop({ type: Number, required: true, min: 1 }) quantity: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ type: String, required: true }) receiver: string;
  @Prop({ type: String, required: true }) phone: string;
  @Prop({ type: String, required: true }) province: string;
  @Prop({ type: String, required: true }) city: string;
  @Prop({ type: String, required: true }) address: string;
  @Prop({ type: String, required: true }) postalCode: string;
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ _id: false })
export class StatusEntry {
  @Prop({ type: String, required: true }) status: OrderStatus;
  @Prop({ type: Date, required: true }) at: Date;
  @Prop({ type: String }) note?: string;
  @Prop({ type: String }) by?: string;
}
const StatusEntrySchema = SchemaFactory.createForClass(StatusEntry);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: String, required: true, unique: true }) orderNumber: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) user: Types.ObjectId;
  @Prop({ type: [OrderItemSchema], required: true }) items: OrderItem[];
  @Prop({ type: ShippingAddressSchema, required: true }) shippingAddress: ShippingAddress;
  @Prop({ type: String, enum: SHIPPING_METHODS, required: true }) shippingMethod: ShippingMethod;
  @Prop({ type: Number, required: true }) shippingCost: number;
  @Prop({ type: Number, required: true }) subtotal: number;
  @Prop({ type: Number, default: 0 }) discountAmount: number;
  @Prop({ type: String }) couponCode?: string;
  @Prop({ type: Number, required: true }) total: number;
  @Prop({ type: String, enum: ORDER_STATUSES, default: 'pending_payment' }) status: OrderStatus;
  @Prop({ type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' }) paymentStatus: 'unpaid' | 'paid' | 'refunded';
  @Prop({ type: String }) trackingCode?: string;
  @Prop({ type: Date }) paidAt?: Date;
  @Prop({ type: Date }) deliveredAt?: Date;
  @Prop({ type: Date, required: true }) expiresAt: Date; // unpaid orders are cancelled (stock released) after this
  @Prop({ type: String }) cancelReason?: string;
  @Prop({ type: [StatusEntrySchema], default: [] }) statusHistory: StatusEntry[];
}
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, expiresAt: 1 });
OrderSchema.index({ createdAt: -1 });
