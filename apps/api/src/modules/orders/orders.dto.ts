import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ORDER_STATUSES, OrderStatus, SHIPPING_METHODS, ShippingMethod } from './schemas/order.schema';

export class CreateOrderDto {
  @IsMongoId() addressId: string;
  @IsEnum(SHIPPING_METHODS) shippingMethod: ShippingMethod;
}

export class OrderStatusDto {
  @IsEnum(ORDER_STATUSES) status: OrderStatus;
  @IsOptional() @Matches(/^[A-Za-z0-9-]{3,40}$/, { message: 'INVALID_TRACKING_CODE' }) trackingCode?: string;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class OrdersQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
  @IsOptional() @IsEnum(ORDER_STATUSES) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(40) q?: string;
}
