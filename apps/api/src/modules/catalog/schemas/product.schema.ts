import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { Localized, LocalizedSchema, LocalizedTextSchema } from '../../../common/schemas/localized.schema';

export const GENDERS = ['men', 'women', 'unisex', 'kids'] as const;
export type Gender = (typeof GENDERS)[number];

@Schema({ _id: false })
export class ColorOption {
  @Prop({ type: LocalizedSchema, required: true }) name: Localized;
  @Prop({ type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ }) hex: string;
}
const ColorSchema = SchemaFactory.createForClass(ColorOption);

@Schema()
export class Variant {
  _id?: Types.ObjectId;
  @Prop({ type: String, required: true, trim: true, maxlength: 40 }) sku: string;
  @Prop({ type: Number, required: true, min: 15, max: 60 }) size: number;
  @Prop({ type: ColorSchema, required: true }) color: ColorOption;
  @Prop({ type: Number, required: true, min: 0, default: 0 }) stock: number;
}
const VariantSchema = SchemaFactory.createForClass(Variant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: LocalizedSchema, required: true }) title: Localized;
  @Prop({ type: String, required: true, unique: true }) slug: string;
  @Prop({ type: LocalizedTextSchema, default: () => ({}) }) description: Localized;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true, index: true }) brand: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true, index: true }) category: Types.ObjectId;

  @Prop({ type: String, enum: GENDERS, required: true, index: true }) gender: Gender;
  @Prop({ type: String, trim: true, maxlength: 100 }) material?: string;
  @Prop({ type: String, trim: true, maxlength: 100 }) sole?: string;
  @Prop({ type: String, trim: true, maxlength: 100 }) closureType?: string;
  @Prop({ type: String, trim: true, maxlength: 100 }) season?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: [String], default: [] }) images: string[];

  /** Prices are integers in Toman. finalPrice is derived (basePrice - discount) and indexed for filtering/sorting. */
  @Prop({ type: Number, required: true, min: 0 }) basePrice: number;
  @Prop({ type: Number, default: 0, min: 0, max: 90 }) discountPercent: number;
  @Prop({ type: Number, required: true, min: 0, index: true }) finalPrice: number;
  @Prop({ type: Number, default: 800, min: 50, max: 10000 }) weightGram: number;

  @Prop({ type: [VariantSchema], default: [] }) variants: Variant[];

  @Prop({ type: Number, default: 0 }) ratingAvg: number;
  @Prop({ type: Number, default: 0 }) ratingCount: number;
  @Prop({ type: Number, default: 0, index: true }) soldCount: number;
  @Prop({ type: Boolean, default: true, index: true }) isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, category: 1, finalPrice: 1 });
