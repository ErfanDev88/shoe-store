import { Logger } from '@nestjs/common';
import { SmsProvider } from './sms.provider';

/** Development only: prints messages in the terminal. Blocked in production by env validation. */
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger('ConsoleSms');

  async sendTemplate(phone: string, templateId: number, params: Record<string, string>): Promise<void> {
    this.logger.warn(`[DEV] SMS template ${templateId} to ${phone}: ${JSON.stringify(params)}`);
  }
  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn(`[DEV] OTP for ${phone}: ${code}`);
  }
}
