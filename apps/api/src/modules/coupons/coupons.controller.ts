import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreateCouponDto, UpdateCouponDto } from './coupons.dto';
import { CouponsService } from './coupons.service';

@Roles(Role.Admin)
@Controller('admin/coupons')
export class CouponsAdminController {
  constructor(private readonly coupons: CouponsService) {}
  @Get() list(@Query() q: PageQuery) { return this.coupons.list(q); }
  @Post() create(@Body() dto: CreateCouponDto) { return this.coupons.create(dto); }
  @Patch(':id') update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCouponDto) { return this.coupons.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseObjectIdPipe) id: string) { return this.coupons.remove(id); }
}
