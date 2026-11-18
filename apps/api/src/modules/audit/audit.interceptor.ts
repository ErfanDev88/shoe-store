import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from './audit-log.schema';

/** Logs every state-changing request made by staff (role != customer). Bodies are never stored. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLog>) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const write = (status: number) => {
      const user = req.user;
      if (!user || user.role === Role.Customer || req.method === 'GET') return;
      this.model
        .create({ actor: user.id, role: user.role, method: req.method, path: req.originalUrl.split('?')[0], params: req.params, status, ip: req.ip })
        .catch(() => undefined);
    };
    return next.handle().pipe(
      tap({
        next: () => write(res.statusCode),
        error: (e) => write(e instanceof HttpException ? e.getStatus() : 500),
      }),
    );
  }
}
