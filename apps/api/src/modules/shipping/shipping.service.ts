import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Model } from 'mongoose';
import { isDuplicateKey } from '../../common/utils/slug.util';
import { SHIPPING_METHODS, ShippingMethod } from '../orders/schemas/order.schema';
import { ShippingRule } from './shipping-rule.schema';

export class ShippingRuleDto {
  @IsString() @MaxLength(60) province: string;
  @IsEnum(SHIPPING_METHODS) method: ShippingMethod;
  @IsInt() @Min(0) @Max(100_000_000) baseCost: number;
  @IsInt() @Min(0) @Max(100_000_000) perKgCost: number;
  @IsOptional() @IsInt() @Min(0) freeShippingThreshold?: number;
  @IsOptional() @IsInt() @Min(0) @Max(60) minDays?: number;
  @IsOptional() @IsInt() @Min(0) @Max(60) maxDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);
  constructor(@InjectModel(ShippingRule.name) private readonly model: Model<ShippingRule>) {}

  /** Seeds sensible default rules (Toman) on first start; edit them from the admin panel. */
  async onModuleInit() {
    if (await this.model.estimatedDocumentCount()) return;
    await this.model.insertMany([
      { province: '*', method: 'pishtaz', baseCost: 60_000, perKgCost: 15_000, freeShippingThreshold: 3_000_000, minDays: 3, maxDays: 7 },
      { province: '*', method: 'tipax', baseCost: 90_000, perKgCost: 20_000, minDays: 1, maxDays: 4 },
    ]);
    this.logger.log('Seeded default shipping rules');
  }

  async calculate(method: ShippingMethod, province: string, weightGram: number, subtotal: number) {
    const rule =
      (await this.model.findOne({ method, province, isActive: true }).lean()) ??
      (await this.model.findOne({ method, province: '*', isActive: true }).lean());
    if (!rule) throw new BadRequestException('SHIPPING_UNAVAILABLE');
    const kg = Math.max(1, Math.ceil(weightGram / 1000));
    const free = !!rule.freeShippingThreshold && subtotal >= rule.freeShippingThreshold;
    return { method, cost: free ? 0 : rule.baseCost + rule.perKgCost * (kg - 1), free, minDays: rule.minDays, maxDays: rule.maxDays };
  }

  async quote(province: string, weightGram: number, subtotal: number) {
    const out = [];
    for (const m of SHIPPING_METHODS) out.push(await this.calculate(m, province, weightGram, subtotal).catch(() => null));
    return out.filter(Boolean);
  }

  // ---------- admin ----------
  list() { return this.model.find().sort({ province: 1, method: 1 }).lean(); }

  async create(dto: ShippingRuleDto) {
    try { return await this.model.create(dto); } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('RULE_EXISTS');
      throw e;
    }
  }
  async update(id: string, dto: Partial<ShippingRuleDto>) {
    const doc = await this.model.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!doc) throw new NotFoundException('RULE_NOT_FOUND');
    return doc;
  }
  async remove(id: string) {
    const res = await this.model.deleteOne({ _id: id });
    if (!res.deletedCount) throw new NotFoundException('RULE_NOT_FOUND');
    return { deleted: true };
  }
}
