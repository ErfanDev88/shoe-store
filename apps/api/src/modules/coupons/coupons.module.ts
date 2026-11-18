import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Coupon, CouponSchema } from './coupon.schema';
import { CouponsAdminController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }, { name: Order.name, schema: OrderSchema }])],
  controllers: [CouponsAdminController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
