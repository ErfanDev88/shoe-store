import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { ShippingRule, ShippingRuleSchema } from './shipping-rule.schema';
import { ShippingAdminController, ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ShippingRule.name, schema: ShippingRuleSchema }]), CartModule],
  controllers: [ShippingController, ShippingAdminController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
