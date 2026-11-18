import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQuery } from '../../common/dto/pagination.dto';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { Payment } from './payment.schema';
import { ZarinpalService } from './zarinpal.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly frontend: string;

  constructor(
    @InjectModel(Payment.name) private readonly model: Model<Payment>,
    private readonly gateway: ZarinpalService,
    private readonly orders: OrdersService,
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    this.frontend = config.get<string>('FRONTEND_URL')!.replace(/\/$/, '');
  }

  /** Starts a payment for one of MY unpaid orders. The amount is taken from the DB, never from the client. */
  async start(userId: string, orderId: string) {
    const order = await this.orders.getMine(userId, orderId);
    if (order.status !== 'pending_payment') throw new BadRequestException('ORDER_NOT_PAYABLE');
    const user = await this.users.findById(userId);

    const { authority, url } = await this.gateway.request(
      order.total,
      `Order ${order.orderNumber}`,
      `${this.frontend}/api/payments/zarinpal/callback`, // reaches this API through the Next.js proxy
      { mobile: order.shippingAddress.phone, email: user?.email },
    );
    await this.model.create({ order: order._id, user: userId, authority, amount: order.total });
    await this.orders.extendPaymentWindow(orderId);
    return { paymentUrl: url };
  }

  /** Gateway redirects the browser here. We verify server-to-server, so the query string alone proves nothing. */
  async handleCallback(authority: string, status: string): Promise<string> {
    const result = (orderId?: string, ok = false) =>
      `${this.frontend}/payment/result?${orderId ? `order=${orderId}&` : ''}status=${ok ? 'success' : 'failed'}`;
    if (!/^[A-Za-z0-9]{10,64}$/.test(authority)) return result();

    const payment = await this.model.findOne({ authority });
    if (!payment) return result();
    const orderId = String(payment.order);
    if (payment.status === 'success') return result(orderId, true); // page refresh / double callback
    if (payment.status !== 'pending') return result(orderId, false);

    if (status !== 'OK') {
      await this.model.updateOne({ _id: payment._id, status: 'pending' }, { $set: { status: 'failed' } });
      return result(orderId, false);
    }

    const v = await this.gateway.verify(authority, payment.amount);
    if (!v.ok) {
      await this.model.updateOne({ _id: payment._id, status: 'pending' }, { $set: { status: 'failed' } });
      return result(orderId, false);
    }

    // claim the payment atomically so concurrent callbacks can't process it twice
    const claimed = await this.model.findOneAndUpdate(
      { _id: payment._id, status: 'pending' },
      { $set: { status: 'success', refId: v.refId, cardPan: v.cardPan, verifiedAt: new Date() } },
      { new: true },
    );
    if (!claimed) return result(orderId, true);

    const order = await this.orders.markPaid(orderId);
    if (!order) {
      // money was taken but the order was cancelled/expired meanwhile -> needs a manual refund
      await this.model.updateOne({ _id: payment._id }, { $set: { status: 'needs_refund' } });
      this.logger.error(`Payment ${authority} verified but order ${orderId} is no longer payable; refund required`);
      return result(orderId, false);
    }
    this.orders.notifyPaid(order).catch(() => undefined);
    return result(orderId, true);
  }

  async adminList(q: PageQuery, status?: string) {
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('order', 'orderNumber total status').lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }
}
