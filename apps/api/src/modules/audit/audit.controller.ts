import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from './audit-log.schema';

@Roles(Role.Admin)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLog>) {}

  @Get()
  async list(@Query() q: PageQuery) {
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      this.model.estimatedDocumentCount(),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }
}
