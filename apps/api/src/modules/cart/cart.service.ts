import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Localized } from '../../common/schemas/localized.schema';
import { Product } from '../catalog/schemas/product.schema';
import { CouponsService } from '../coupons/coupons.service';
import { AddToCartDto } from './cart.dto';
import { Cart } from './schemas/cart.schema';

export interface CartLine {
  productId: string; sku: string; slug: string; title: Localized; image?: string; size: number;
  color: { name: Localized; hex: string }; unitPrice: number; quantity: number; stock: number;
  available: boolean; lineTotal: number; weightGram: number;
}
export interface CartView {
  lines: CartLine[]; itemCount: number; subtotal: number; discount: number;
  couponCode?: string; couponError?: string; totalWeightGram: number;
}

const MAX_LINES = 30;

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly model: Model<Cart>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    private readonly coupons: CouponsService,
  ) {}

  private getOrCreate(userId: string) {
    return this.model.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true, new: true }).exec();
  }

  /** Cart with live prices/stock. Prices always come from the database, never from the client. */
  async getDetailed(userId: string): Promise<CartView> {
    const cart = await this.model.findOne({ user: userId }).lean();
    if (!cart || !cart.items.length) return { lines: [], itemCount: 0, subtotal: 0, discount: 0, totalWeightGram: 0 };

    const found = await this.products.find({ _id: { $in: cart.items.map((i) => i.product) } }).select('title slug images variants finalPrice weightGram isActive').lean();
    const byId = new Map(found.map((p) => [String(p._id), p]));

    const lines: CartLine[] = [];
    for (const item of cart.items) {
      const p = byId.get(String(item.product));
      const v = p?.variants.find((x) => x.sku === item.sku);
      if (!p || !v) continue; // product or variant no longer exists
      lines.push({
        productId: String(p._id), sku: v.sku, slug: p.slug, title: p.title, image: p.images[0], size: v.size,
        color: { name: v.color.name, hex: v.color.hex }, unitPrice: p.finalPrice, quantity: item.quantity, stock: v.stock,
        available: p.isActive && v.stock >= item.quantity, lineTotal: p.finalPrice * item.quantity, weightGram: p.weightGram * item.quantity,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    let discount = 0;
    let couponError: string | undefined;
    if (cart.couponCode && subtotal > 0) {
      try {
        discount = (await this.coupons.evaluate(cart.couponCode, userId, subtotal)).discount;
      } catch (e) {
        couponError = e instanceof BadRequestException ? String(e.message) : 'COUPON_INVALID';
      }
    }
    return {
      lines, itemCount: lines.reduce((n, l) => n + l.quantity, 0), subtotal, discount,
      couponCode: cart.couponCode, couponError, totalWeightGram: lines.reduce((w, l) => w + l.weightGram, 0),
    };
  }

  async add(userId: string, dto: AddToCartDto) {
    const p = await this.products.findOne({ _id: dto.productId, isActive: true }).select('variants').lean();
    const v = p?.variants.find((x) => x.sku === dto.sku);
    if (!p || !v) throw new NotFoundException('VARIANT_NOT_FOUND');

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find((i) => i.sku === dto.sku);
    const qty = (existing?.quantity ?? 0) + dto.quantity;
    if (qty > 10) throw new BadRequestException('MAX_QUANTITY');
    if (qty > v.stock) throw new BadRequestException('INSUFFICIENT_STOCK');

    if (existing) existing.quantity = qty;
    else {
      if (cart.items.length >= MAX_LINES) throw new BadRequestException('CART_FULL');
      cart.items.push({ product: p._id, sku: dto.sku, quantity: qty });
    }
    await cart.save();
    return this.getDetailed(userId);
  }

  /** Used after login to merge the browser's guest cart; invalid lines are skipped silently. */
  async merge(userId: string, items: AddToCartDto[]) {
    for (const it of items) await this.add(userId, it).catch(() => undefined);
    return this.getDetailed(userId);
  }

  async setQuantity(userId: string, sku: string, quantity: number) {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => i.sku === sku);
    if (!item) throw new NotFoundException('ITEM_NOT_IN_CART');
    const p = await this.products.findOne({ _id: item.product, isActive: true }).select('variants').lean();
    const v = p?.variants.find((x) => x.sku === sku);
    if (!v) throw new NotFoundException('VARIANT_NOT_FOUND');
    if (quantity > v.stock) throw new BadRequestException('INSUFFICIENT_STOCK');
    item.quantity = quantity;
    await cart.save();
    return this.getDetailed(userId);
  }

  async remove(userId: string, sku: string) {
    await this.model.updateOne({ user: userId }, { $pull: { items: { sku } } });
    return this.getDetailed(userId);
  }

  async clear(userId: string, session?: ClientSession) {
    await this.model.updateOne({ user: userId }, { $set: { items: [] }, $unset: { couponCode: 1 } }, { session });
  }

  async applyCoupon(userId: string, code: string) {
    const view = await this.getDetailed(userId);
    await this.coupons.evaluate(code, userId, view.subtotal); // throws a COUPON_* code if not usable
    await this.model.updateOne({ user: userId }, { $set: { couponCode: code } });
    return this.getDetailed(userId);
  }

  async removeCoupon(userId: string) {
    await this.model.updateOne({ user: userId }, { $unset: { couponCode: 1 } });
    return this.getDetailed(userId);
  }
}
