import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import { CreateOrderDto, OrderStatusDto, OrdersQuery } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateOrderDto) { return this.orders.create(u.id, dto); }
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PageQuery) { return this.orders.listMine(u.id, q.page, q.limit); }
  @Get(':id') one(@CurrentUser() u: AuthUser, @Param('id', ParseObjectIdPipe) id: string) { return this.orders.getMine(u.id, id); }
  @HttpCode(200) @Post(':id/cancel') cancel(@CurrentUser() u: AuthUser, @Param('id', ParseObjectIdPipe) id: string) { return this.orders.cancelMine(u.id, id); }
}

@Roles(Role.Admin, Role.Support)
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get() list(@Query() q: OrdersQuery) { return this.orders.adminList(q); }
  @Get(':id') one(@Param('id', ParseObjectIdPipe) id: string) { return this.orders.adminGet(id); }
  @Patch(':id/status') status(@CurrentUser() u: AuthUser, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: OrderStatusDto) { return this.orders.updateStatus(id, dto, u.id); }
  @Roles(Role.Admin) @Patch(':id/refunded') refunded(@Param('id', ParseObjectIdPipe) id: string) { return this.orders.markRefunded(id); }
}
