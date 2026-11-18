import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';
import { PAID_STATUSES } from '../orders/orders.service';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Review, ReviewSchema } from '../reviews/reviews.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
  ) {}

  async dashboard() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const paid = { status: { $in: PAID_STATUSES } };
    const sum = { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } };

    const [all, last30, byStatus, usersCount, newUsers, pendingReviews, lowStock, salesByDay, topProducts, recentOrders] = await Promise.all([
      this.orders.aggregate([{ $match: paid }, sum]),
      this.orders.aggregate([{ $match: { ...paid, createdAt: { $gte: since } } }, sum]),
      this.orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.users.countDocuments(),
      this.users.countDocuments({ createdAt: { $gte: since } }),
      this.reviews.countDocuments({ isApproved: false }),
      this.products.aggregate([
        { $match: { isActive: true } }, { $unwind: '$variants' }, { $match: { 'variants.stock': { $lte: 3 } } },
        { $sort: { 'variants.stock': 1 } }, { $limit: 15 },
        { $project: { _id: 0, productId: '$_id', title: 1, slug: 1, sku: '$variants.sku', size: '$variants.size', stock: '$variants.stock' } },
      ]),
      this.orders.aggregate([
        { $match: { ...paid, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Tehran' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
      ]),
      this.orders.aggregate([
        { $match: paid }, { $unwind: '$items' },
        { $group: { _id: '$items.product', title: { $first: '$items.title' }, slug: { $first: '$items.slug' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { quantity: -1 } }, { $limit: 5 },
      ]),
      this.orders.find().sort({ createdAt: -1 }).limit(6).select('orderNumber total status createdAt shippingAddress.receiver').lean(),
    ]);

    return {
      revenue: { total: all[0]?.revenue ?? 0, orders: all[0]?.orders ?? 0, last30: last30[0]?.revenue ?? 0, ordersLast30: last30[0]?.orders ?? 0 },
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      users: { total: usersCount, last30: newUsers },
      pendingReviews, lowStock, salesByDay, topProducts, recentOrders,
    };
  }
}

@Roles(Role.Admin)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}
  @Get() get() { return this.stats.dashboard(); }
}

@Module({
  imports: [MongooseModule.forFeature([
    { name: Order.name, schema: OrderSchema }, { name: User.name, schema: UserSchema },
    { name: Product.name, schema: ProductSchema }, { name: Review.name, schema: ReviewSchema },
  ])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
