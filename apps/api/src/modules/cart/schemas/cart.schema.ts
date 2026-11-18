import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true }) product: Types.ObjectId;
  @Prop({ type: String, required: true }) sku: string;
  @Prop({ type: Number, required: true, min: 1, max: 10 }) quantity: number;
}
const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true }) user: Types.ObjectId;
  @Prop({ type: [CartItemSchema], default: [] }) items: CartItem[];
  @Prop({ type: String }) couponCode?: string;
}
export const CartSchema = SchemaFactory.createForClass(Cart);
