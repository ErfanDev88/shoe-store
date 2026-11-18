import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import { CartService } from '../cart/cart.service';
import { ShippingRuleDto, ShippingService } from './shipping.service';

class QuoteDto { @IsString() @MaxLength(60) province: string; }
class UpdateShippingRuleDto extends PartialType(ShippingRuleDto) {}

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService, private readonly cart: CartService) {}

  /** Shipping options + cost for the current cart and destination province. */
  @HttpCode(200)
  @Post('quote')
  async quote(@CurrentUser() u: AuthUser, @Body() dto: QuoteDto) {
    const cart = await this.cart.getDetailed(u.id);
    return this.shipping.quote(dto.province, cart.totalWeightGram, cart.subtotal);
  }
}

@Roles(Role.Admin)
@Controller('admin/shipping-rules')
export class ShippingAdminController {
  constructor(private readonly shipping: ShippingService) {}
  @Get() list() { return this.shipping.list(); }
  @Post() create(@Body() dto: ShippingRuleDto) { return this.shipping.create(dto); }
  @Patch(':id') update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateShippingRuleDto) { return this.shipping.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseObjectIdPipe) id: string) { return this.shipping.remove(id); }
}
