import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsInt, IsOptional, IsString, Length, Max, Min, MaxLength } from 'class-validator';
import { Model, Schema as MongooseSchema, Types } from 'mongoose';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import { isDuplicateKey } from '../../common/utils/slug.util';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';
import { PAID_STATUSES } from '../orders/orders.service';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true, index: true }) product: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) user: Types.ObjectId;
  @Prop({ type: String, required: true }) userName: string;
  @Prop({ type: Number, required: true, min: 1, max: 5 }) rating: number;
  @Prop({ type: String, default: '', maxlength: 1000 }) comment: string;
  @Prop({ type: Boolean, default: false, index: true }) isApproved: boolean;
}
export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
class ReviewsAdminQuery extends PageQuery {
  @IsOptional() @IsString() @Length(1, 10) status?: string; // pending | approved | all
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly model: Model<Review>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  async listPublic(productId: string, page: number, limit: number) {
    const filter = { product: productId, isApproved: true };
    const [items, total] = await Promise.all([
      this.model.find(filter).select('rating comment userName createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  /** Only customers who actually bought (and paid for) the product can review it; one review each, moderated. */
  async create(userId: string, productId: string, dto: CreateReviewDto) {
    if (!(await this.products.exists({ _id: productId }))) throw new NotFoundException('PRODUCT_NOT_FOUND');
    const bought = await this.orders.exists({ user: userId, 'items.product': productId, status: { $in: PAID_STATUSES } });
    if (!bought) throw new ForbiddenException('PURCHASE_REQUIRED');
    const u = await this.users.findById(userId).select('firstName lastName').lean();
    const userName = [u?.firstName, u?.lastName?.slice(0, 1) && `${u.lastName.slice(0, 1)}.`].filter(Boolean).join(' ') || 'کاربر';
    try {
      await this.model.create({ product: productId, user: userId, userName, rating: dto.rating, comment: dto.comment?.trim() ?? '' });
    } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('ALREADY_REVIEWED');
      throw e;
    }
    return { message: 'REVIEW_PENDING_APPROVAL' };
  }

  async adminList(q: ReviewsAdminQuery) {
    const filter = q.status === 'approved' ? { isApproved: true } : q.status === 'all' ? {} : { isApproved: false };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('product', 'title slug').lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  async approve(id: string) {
    const r = await this.model.findByIdAndUpdate(id, { $set: { isApproved: true } }, { new: true });
    if (!r) throw new NotFoundException('REVIEW_NOT_FOUND');
    await this.recalc(r.product);
    return r;
  }

  async remove(id: string) {
    const r = await this.model.findByIdAndDelete(id);
    if (!r) throw new NotFoundException('REVIEW_NOT_FOUND');
    await this.recalc(r.product);
    return { deleted: true };
  }

  private async recalc(productId: Types.ObjectId) {
    const [agg] = await this.model.aggregate([{ $match: { product: productId, isApproved: true } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    await this.products.updateOne({ _id: productId }, { $set: { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count ?? 0 } });
  }
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public() @Get('products/:productId/reviews')
  list(@Param('productId', ParseObjectIdPipe) id: string, @Query() q: PageQuery) { return this.reviews.listPublic(id, q.page, Math.min(q.limit, 50)); }

  @HttpCode(201) @Post('products/:productId/reviews')
  create(@CurrentUser() u: AuthUser, @Param('productId', ParseObjectIdPipe) id: string, @Body() dto: CreateReviewDto) { return this.reviews.create(u.id, id, dto); }
}

@Roles(Role.Admin, Role.Content)
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsService) {}
  @Get() list(@Query() q: ReviewsAdminQuery) { return this.reviews.adminList(q); }
  @Patch(':id/approve') approve(@Param('id', ParseObjectIdPipe) id: string) { return this.reviews.approve(id); }
  @Delete(':id') remove(@Param('id', ParseObjectIdPipe) id: string) { return this.reviews.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([
    { name: Review.name, schema: ReviewSchema }, { name: Product.name, schema: ProductSchema },
    { name: Order.name, schema: OrderSchema }, { name: User.name, schema: UserSchema },
  ])],
  controllers: [ReviewsController, ReviewsAdminController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
