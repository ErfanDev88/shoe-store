import { Body, Controller, Get, HttpCode, Injectable, Module, Post, Query } from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { Model } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageQuery } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { isDuplicateKey } from '../../common/utils/slug.util';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Subscriber {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 }) email: string;
}
export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);

class SubscribeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @IsEmail() @MaxLength(254) email: string;
}

@Injectable()
export class NewsletterService {
  constructor(@InjectModel(Subscriber.name) private readonly model: Model<Subscriber>) {}

  /** Idempotent and always answers the same, so the endpoint cannot be used to check who is subscribed. */
  async subscribe(email: string) {
    try { await this.model.create({ email }); } catch (e) { if (!isDuplicateKey(e)) throw e; }
    return { message: 'SUBSCRIBED' };
  }

  async list(q: PageQuery) {
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      this.model.countDocuments(),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }
}

@Controller()
export class NewsletterController {
  constructor(private readonly svc: NewsletterService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('newsletter')
  subscribe(@Body() dto: SubscribeDto) { return this.svc.subscribe(dto.email); }

  @Roles(Role.Admin)
  @Get('admin/newsletter')
  list(@Query() q: PageQuery) { return this.svc.list(q); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Subscriber.name, schema: SubscriberSchema }])],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
