import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Localized, LocalizedSchema } from '../../../common/schemas/localized.schema';

@Schema({ timestamps: true })
export class Brand {
  @Prop({ type: LocalizedSchema, required: true }) name: Localized;
  @Prop({ type: String, required: true, unique: true }) slug: string;
  @Prop({ type: String }) image?: string;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
}
export const BrandSchema = SchemaFactory.createForClass(Brand);

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: LocalizedSchema, required: true }) name: Localized;
  @Prop({ type: String, required: true, unique: true }) slug: string;
  @Prop({ type: String }) image?: string;
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null }) parent?: Types.ObjectId | null;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
