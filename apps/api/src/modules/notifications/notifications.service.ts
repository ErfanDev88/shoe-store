import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { SmsProvider } from './sms/sms.provider';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Every method swallows its own errors: a failed notification must never break an order or login. */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;
  private readonly orderTemplateId?: number;
  readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly sms: SmsProvider,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL')!.replace(/\/$/, '');
    this.from = config.get<string>('SMTP_FROM') || 'Shoe Store <no-reply@localhost>';
    const tpl = config.get<string>('SMSIR_ORDER_TEMPLATE_ID');
    this.orderTemplateId = tpl ? Number(tpl) : undefined;

    const host = config.get<string>('SMTP_HOST');
    if (!host) this.logger.warn('SMTP_HOST is empty: e-mails are NOT sent, they are only printed in this terminal. Set SMTP_* in .env to send real e-mails.');
    if (host) {
      const port = Number(config.get('SMTP_PORT') ?? 587);
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: config.get('SMTP_USER') ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') } : undefined,
      });
    }
  }

  /** `text` is also what gets printed in development when SMTP isn't configured. */
  async email(to: string, subject: string, text: string, cta?: { url: string; label: string }) {
    if (!this.transporter) {
      this.logger.warn(`[DEV e-mail] to=${to} subject="${subject}"\n${text}${cta ? `\n${cta.url}` : ''}`);
      return;
    }
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;max-width:560px;margin:auto">
      <h2 style="margin:0 0 12px">${esc(subject)}</h2><p>${esc(text).replace(/\n/g, '<br>')}</p>
      ${cta ? `<p><a href="${esc(cta.url)}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">${esc(cta.label)}</a></p><p style="color:#777;font-size:12px;direction:ltr;text-align:left">${esc(cta.url)}</p>` : ''}
    </div>`;
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text: cta ? `${text}\n${cta.url}` : text, html });
    } catch (e) {
      this.logger.error(`e-mail to ${to} failed: ${(e as Error).message}`);
    }
  }

  async orderNotice(order: { orderNumber: string }, user: { phone?: string; email?: string }, kind: 'paid' | 'shipped', trackingCode?: string) {
    const subject = kind === 'paid' ? `سفارش ${order.orderNumber} ثبت و پرداخت شد` : `سفارش ${order.orderNumber} ارسال شد`;
    const text =
      kind === 'paid'
        ? 'پرداخت شما با موفقیت انجام شد و سفارش در حال آماده‌سازی است. ممنون از خرید شما.'
        : `سفارش شما تحویل پست شد.${trackingCode ? ` کد رهگیری: ${trackingCode}` : ''}`;
    if (user.email) await this.email(user.email, subject, text, { url: `${this.frontendUrl}/account/orders`, label: 'مشاهده سفارش‌ها' });
    if (user.phone && this.orderTemplateId) {
      try {
        await this.sms.sendTemplate(user.phone, this.orderTemplateId, { OrderNumber: order.orderNumber });
      } catch (e) {
        this.logger.error(`order SMS failed: ${(e as Error).message}`);
      }
    }
  }
}
