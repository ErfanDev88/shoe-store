import { Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Post, BadRequestException } from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema, Types } from 'mongoose';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true }) user: Types.ObjectId;
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }], default: [] }) products: Types.ObjectId[];
}
export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly model: Model<Wishlist>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  async ids(userId: string) {
    const w = await this.model.findOne({ user: userId }).lean();
    return (w?.products ?? []).map(String);
  }

  async list(userId: string) {
    const ids = await this.ids(userId);
    if (!ids.length) return [];
    return this.products.find({ _id: { $in: ids }, isActive: true }).select('-description').populate('brand', 'name slug').lean();
  }

  async add(userId: string, productId: string) {
    if (!(await this.products.exists({ _id: productId, isActive: true }))) throw new NotFoundException('PRODUCT_NOT_FOUND');
    const w = await this.model.findOne({ user: userId }).lean();
    if ((w?.products.length ?? 0) >= 200) throw new BadRequestException('WISHLIST_FULL');
    await this.model.updateOne({ user: userId }, { $addToSet: { products: productId } }, { upsert: true });
    return this.ids(userId);
  }

  async remove(userId: string, productId: string) {
    await this.model.updateOne({ user: userId }, { $pull: { products: productId } });
    return this.ids(userId);
  }
}

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly svc: WishlistService) {}
  @Get() list(@CurrentUser() u: AuthUser) { return this.svc.list(u.id); }
  @Get('ids') ids(@CurrentUser() u: AuthUser) { return this.svc.ids(u.id); }
  @HttpCode(200) @Post(':productId') add(@CurrentUser() u: AuthUser, @Param('productId', ParseObjectIdPipe) id: string) { return this.svc.add(u.id, id); }
  @Delete(':productId') remove(@CurrentUser() u: AuthUser, @Param('productId', ParseObjectIdPipe) id: string) { return this.svc.remove(u.id, id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }, { name: Product.name, schema: ProductSchema }])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
