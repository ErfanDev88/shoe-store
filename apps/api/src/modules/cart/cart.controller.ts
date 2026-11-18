import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CouponCodeDto } from '../coupons/coupons.dto';
import { AddToCartDto, MergeCartDto, SetQuantityDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get() get(@CurrentUser() u: AuthUser) { return this.cart.getDetailed(u.id); }
  @HttpCode(200) @Post('items') add(@CurrentUser() u: AuthUser, @Body() dto: AddToCartDto) { return this.cart.add(u.id, dto); }
  @HttpCode(200) @Post('merge') merge(@CurrentUser() u: AuthUser, @Body() dto: MergeCartDto) { return this.cart.merge(u.id, dto.items); }
  @Patch('items/:sku') setQty(@CurrentUser() u: AuthUser, @Param('sku') sku: string, @Body() dto: SetQuantityDto) { return this.cart.setQuantity(u.id, sku, dto.quantity); }
  @Delete('items/:sku') remove(@CurrentUser() u: AuthUser, @Param('sku') sku: string) { return this.cart.remove(u.id, sku); }
  @HttpCode(200) @Post('coupon') apply(@CurrentUser() u: AuthUser, @Body() dto: CouponCodeDto) { return this.cart.applyCoupon(u.id, dto.code); }
  @Delete('coupon') removeCoupon(@CurrentUser() u: AuthUser) { return this.cart.removeCoupon(u.id); }
}
