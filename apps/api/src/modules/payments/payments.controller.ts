import { Controller, Get, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @HttpCode(200)
  @Post('orders/:orderId/pay')
  pay(@CurrentUser() u: AuthUser, @Param('orderId', ParseObjectIdPipe) orderId: string) {
    return this.payments.start(u.id, orderId);
  }

  @Public()
  @Get('zarinpal/callback')
  async callback(@Query('Authority') authority: unknown, @Query('Status') status: unknown, @Res() res: Response) {
    const url = await this.payments.handleCallback(typeof authority === 'string' ? authority : '', typeof status === 'string' ? status : '');
    res.redirect(302, url);
  }
}

class PaymentsQuery extends PageQuery {
  @IsOptional() @IsIn(['pending', 'success', 'failed', 'needs_refund']) status?: string;
}

@Roles(Role.Admin)
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list(@Query() q: PaymentsQuery) { return this.payments.adminList(q, q.status); }
}
