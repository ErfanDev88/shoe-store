import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SHIPPING_METHODS, ShippingMethod } from '../orders/schemas/order.schema';

@Schema({ timestamps: true })
export class ShippingRule {
  /** Province name, or "*" for the default rule used when a province has no specific rule. */
  @Prop({ type: String, required: true, trim: true }) province: string;
  @Prop({ type: String, enum: SHIPPING_METHODS, required: true }) method: ShippingMethod;
  @Prop({ type: Number, required: true, min: 0 }) baseCost: number; // covers the first kg
  @Prop({ type: Number, required: true, min: 0 }) perKgCost: number; // each additional kg
  @Prop({ type: Number, min: 0 }) freeShippingThreshold?: number;
  @Prop({ type: Number, default: 2 }) minDays: number;
  @Prop({ type: Number, default: 5 }) maxDays: number;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
}
export const ShippingRuleSchema = SchemaFactory.createForClass(ShippingRule);
ShippingRuleSchema.index({ province: 1, method: 1 }, { unique: true });
