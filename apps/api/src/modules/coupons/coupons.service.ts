import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { PageQuery } from '../../common/dto/pagination.dto';
import { isDuplicateKey } from '../../common/utils/slug.util';
import { Order } from '../orders/schemas/order.schema';
import { CreateCouponDto, UpdateCouponDto } from './coupons.dto';
import { Coupon } from './coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private readonly model: Model<Coupon>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
  ) {}

  /** Validates a coupon for this user/subtotal and returns the discount. Errors are machine-readable codes. */
  async evaluate(code: string, userId: string, subtotal: number) {
    const c = await this.model.findOne({ code: code.trim().toUpperCase() }).lean();
    const now = new Date();
    if (!c || !c.isActive || (c.startsAt && c.startsAt > now)) throw new BadRequestException('COUPON_INVALID');
    if (c.expiresAt && c.expiresAt < now) throw new BadRequestException('COUPON_EXPIRED');
    if (subtotal < c.minOrder) throw new BadRequestException('COUPON_MIN_ORDER');
    if (c.usageLimit && c.usedCount >= c.usageLimit) throw new BadRequestException('COUPON_LIMIT_REACHED');
    if (c.perUserLimit) {
      const used = await this.orders.countDocuments({ user: userId, couponCode: c.code, status: { $ne: 'cancelled' } });
      if (used >= c.perUserLimit) throw new BadRequestException('COUPON_USER_LIMIT');
    }
    let discount = c.type === 'percent' ? Math.floor((subtotal * c.value) / 100) : c.value;
    if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    return { discount: Math.min(discount, subtotal), code: c.code };
  }

  /** Atomically takes one use of the coupon (inside the order transaction). */
  async redeem(code: string, session: ClientSession) {
    const res = await this.model.updateOne(
      { code, $expr: { $or: [{ $eq: [{ $ifNull: ['$usageLimit', 0] }, 0] }, { $lt: ['$usedCount', '$usageLimit'] }] } },
      { $inc: { usedCount: 1 } },
      { session },
    );
    if (res.modifiedCount !== 1) throw new BadRequestException('COUPON_LIMIT_REACHED');
  }

  async release(code: string, session?: ClientSession) {
    await this.model.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });
  }

  // ---------- admin ----------
  async list(q: PageQuery) {
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      this.model.countDocuments(),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  private check(dto: { type?: string; value?: number }) {
    if (dto.type === 'percent' && dto.value !== undefined && dto.value > 100) throw new BadRequestException('INVALID_PERCENT');
  }

  async create(dto: CreateCouponDto) {
    this.check(dto);
    try {
      return await this.model.create(dto);
    } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('COUPON_CODE_TAKEN');
      throw e;
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('COUPON_NOT_FOUND');
    this.check({ type: dto.type ?? doc.type, value: dto.value ?? doc.value });
    Object.assign(doc, dto);
    return doc.save();
  }

  async remove(id: string) {
    const res = await this.model.deleteOne({ _id: id });
    if (!res.deletedCount) throw new NotFoundException('COUPON_NOT_FOUND');
    return { deleted: true };
  }
}
