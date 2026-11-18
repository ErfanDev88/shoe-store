import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: String, index: true }) actor: string;
  @Prop({ type: String }) role: string;
  @Prop({ type: String }) method: string;
  @Prop({ type: String }) path: string;
  @Prop({ type: Object }) params?: Record<string, unknown>;
  @Prop({ type: Number }) status: number;
  @Prop({ type: String }) ip?: string;
}
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // keep one year
