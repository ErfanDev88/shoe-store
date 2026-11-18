import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomInt } from 'crypto';
import { ClientSession, Connection, FilterQuery, Model } from 'mongoose';
import { escapeRegex } from '../../common/dto/pagination.dto';
import { isDuplicateKey } from '../../common/utils/slug.util';
import { CartService } from '../cart/cart.service';
import { Product } from '../catalog/schemas/product.schema';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShippingService } from '../shipping/shipping.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto, OrderStatusDto, OrdersQuery } from './orders.dto';
import { Order, OrderStatus } from './schemas/order.schema';

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
export const PAID_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectConnection() private readonly conn: Connection,
    private readonly users: UsersService,
    private readonly cart: CartService,
    private readonly shipping: ShippingService,
    private readonly coupons: CouponsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------- customer ----------------
  /**
   * Creates an order from the server-side cart. Everything (prices, discount, shipping, totals) is
   * recomputed here; stock is reserved atomically inside a transaction so we can never oversell.
   */
  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.users.findById(userId);
    const address = user?.addresses.find((a) => String(a._id) === dto.addressId);
    if (!user || !address) throw new BadRequestException('ADDRESS_NOT_FOUND');

    const cart = await this.cart.getDetailed(userId);
    if (!cart.lines.length) throw new BadRequestException('CART_EMPTY');
    if (cart.lines.some((l) => !l.available)) throw new BadRequestException('CART_HAS_UNAVAILABLE_ITEMS');
    if (cart.couponCode && cart.couponError) throw new BadRequestException(cart.couponError);

    const ship = await this.shipping.calculate(dto.shippingMethod, address.province, cart.totalWeightGram, cart.subtotal);
    const total = cart.subtotal - cart.discount + ship.cost;
    const now = new Date();

    for (let attempt = 0; ; attempt++) {
      const orderNumber = `SH${now.toISOString().slice(2, 10).replace(/-/g, '')}${randomInt(100000, 1000000)}`;
      const session = await this.conn.startSession();
      try {
        let created: any;
        await session.withTransaction(async () => {
          for (const l of cart.lines) {
            const r = await this.products.updateOne(
              { _id: l.productId, isActive: true, variants: { $elemMatch: { sku: l.sku, stock: { $gte: l.quantity } } } },
              { $inc: { 'variants.$.stock': -l.quantity, soldCount: l.quantity } },
              { session },
            );
            if (r.modifiedCount !== 1) throw new BadRequestException('OUT_OF_STOCK');
          }
          const useCoupon = cart.couponCode && cart.discount > 0 ? cart.couponCode : undefined;
          if (useCoupon) await this.coupons.redeem(useCoupon, session);

          const [doc] = await this.orders.create(
            [{
              orderNumber, user: user._id,
              items: cart.lines.map((l) => ({
                product: l.productId, sku: l.sku, title: l.title, slug: l.slug, image: l.image, size: l.size,
                colorName: l.color.name, colorHex: l.color.hex, price: l.unitPrice, quantity: l.quantity,
              })),
              shippingAddress: {
                receiver: address.receiver, phone: address.phone, province: address.province,
                city: address.city, address: address.address, postalCode: address.postalCode,
              },
              shippingMethod: dto.shippingMethod, shippingCost: ship.cost, subtotal: cart.subtotal,
              discountAmount: cart.discount, couponCode: useCoupon, total, status: 'pending_payment',
              expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MS),
              statusHistory: [{ status: 'pending_payment', at: now }],
            }],
            { session },
          );
          await this.cart.clear(userId, session);
          created = doc.toObject();
        });
        return created;
      } catch (e) {
        if (isDuplicateKey(e) && attempt < 2) continue; // order-number collision, retry with a new number
        throw e;
      } finally {
        await session.endSession();
      }
    }
  }

  async listMine(userId: string, page: number, limit: number) {
    const filter = { user: userId };
    const [items, total] = await Promise.all([
      this.orders.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.orders.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async getMine(userId: string, id: string) {
    const o = await this.orders.findOne({ _id: id, user: userId }).lean();
    if (!o) throw new NotFoundException('ORDER_NOT_FOUND'); // same answer for "not yours" and "doesn't exist"
    return o;
  }

  async cancelMine(userId: string, id: string) {
    await this.getMine(userId, id);
    const r = await this.cancelAndRestock(id, ['pending_payment'], 'customer', userId);
    if (!r) throw new BadRequestException('CANNOT_CANCEL');
    return r;
  }

  // ---------------- shared state changes ----------------
  /** Atomically cancels (only if currently in one of `from`) and returns reserved stock + coupon use. */
  async cancelAndRestock(id: string, from: OrderStatus[], reason: string, by?: string): Promise<Order | null> {
    const session = await this.conn.startSession();
    try {
      let result: Order | null = null;
      await session.withTransaction(async () => {
        const order = await this.orders.findOneAndUpdate(
          { _id: id, status: { $in: from } },
          { $set: { status: 'cancelled', cancelReason: reason }, $push: { statusHistory: { status: 'cancelled', at: new Date(), note: reason, by } } },
          { new: true, session },
        );
        result = order;
        if (!order) return;
        for (const it of order.items) {
          await this.products.updateOne(
            { _id: it.product, 'variants.sku': it.sku },
            { $inc: { 'variants.$.stock': it.quantity, soldCount: -it.quantity } },
            { session },
          );
        }
        if (order.couponCode) await this.coupons.release(order.couponCode, session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  /** Called after a verified payment. Only succeeds from pending_payment (idempotent). */
  markPaid(orderId: string) {
    const now = new Date();
    return this.orders.findOneAndUpdate(
      { _id: orderId, status: 'pending_payment' },
      { $set: { status: 'paid', paymentStatus: 'paid', paidAt: now }, $push: { statusHistory: { status: 'paid', at: now } } },
      { new: true },
    );
  }

  extendPaymentWindow(orderId: string) {
    return this.orders.updateOne({ _id: orderId, status: 'pending_payment' }, { $set: { expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS) } });
  }

  async notifyPaid(order: Order & { _id?: unknown }) {
    const user = await this.users.findById(String(order.user));
    if (user) await this.notifications.orderNotice(order, user, 'paid');
  }

  /** Unpaid orders release their stock after the payment window. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireUnpaid() {
    const stale = await this.orders.find({ status: 'pending_payment', expiresAt: { $lt: new Date() } }).select('_id').limit(100).lean();
    for (const o of stale) {
      await this.cancelAndRestock(String(o._id), ['pending_payment'], 'expired').catch((e) => this.logger.error(`expire failed: ${e.message}`));
    }
    if (stale.length) this.logger.log(`Expired ${stale.length} unpaid order(s)`);
  }

  // ---------------- admin / support ----------------
  async adminList(q: OrdersQuery) {
    const filter: FilterQuery<Order> = {};
    if (q.status) filter.status = q.status;
    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      filter.$or = [{ orderNumber: re }, { 'shippingAddress.phone': re }, { 'shippingAddress.receiver': re }];
    }
    const [items, total] = await Promise.all([
      this.orders.find(filter).select('-items.title -statusHistory').sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      this.orders.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  async adminGet(id: string) {
    const o = await this.orders.findById(id).populate('user', 'phone email firstName lastName').lean();
    if (!o) throw new NotFoundException('ORDER_NOT_FOUND');
    return o;
  }

  async updateStatus(id: string, dto: OrderStatusDto, actorId: string) {
    const order = await this.orders.findById(id).lean();
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    if (!TRANSITIONS[order.status].includes(dto.status)) throw new BadRequestException('INVALID_TRANSITION');

    if (dto.status === 'cancelled') {
      const r = await this.cancelAndRestock(id, [order.status], dto.note ?? 'admin', actorId);
      if (!r) throw new ConflictException('STATE_CHANGED');
      return r;
    }
    if (dto.status === 'shipped' && !dto.trackingCode) throw new BadRequestException('TRACKING_REQUIRED');

    const now = new Date();
    const set: Record<string, unknown> = { status: dto.status };
    if (dto.status === 'shipped') set.trackingCode = dto.trackingCode;
    if (dto.status === 'delivered') set.deliveredAt = now;
    const updated = await this.orders.findOneAndUpdate(
      { _id: id, status: order.status },
      { $set: set, $push: { statusHistory: { status: dto.status, at: now, note: dto.note, by: actorId } } },
      { new: true },
    );
    if (!updated) throw new ConflictException('STATE_CHANGED');

    if (dto.status === 'shipped') {
      const user = await this.users.findById(String(updated.user));
      if (user) await this.notifications.orderNotice(updated, user, 'shipped', dto.trackingCode);
    }
    return updated;
  }

  /** After the money was returned manually through the gateway panel. */
  async markRefunded(id: string) {
    const o = await this.orders.findOneAndUpdate(
      { _id: id, status: { $in: ['cancelled', 'returned'] }, paymentStatus: 'paid' },
      { $set: { paymentStatus: 'refunded' } },
      { new: true },
    );
    if (!o) throw new BadRequestException('CANNOT_MARK_REFUNDED');
    return o;
  }
}
