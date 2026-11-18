import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsAdminController, PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZarinpalService } from './zarinpal.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]), OrdersModule, UsersModule],
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [PaymentsService, ZarinpalService],
})
export class PaymentsModule {}
