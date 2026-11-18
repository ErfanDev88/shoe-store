import { SmsProvider } from './sms.provider';

/**
 * sms.ir "Verify" (template-based fast send) integration.
 * Template variables are passed by name (the OTP template must contain "Code").
 * Docs: https://app.sms.ir/developer
 */
export class SmsIrProvider extends SmsProvider {
  constructor(
    private readonly apiKey: string,
    private readonly otpTemplateId: number,
  ) {
    super();
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    await this.sendTemplate(phone, this.otpTemplateId, { Code: code });
  }

  async sendTemplate(phone: string, templateId: number, params: Record<string, string>): Promise<void> {
    const res = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-api-key': this.apiKey },
      body: JSON.stringify({
        mobile: phone,
        templateId,
        parameters: Object.entries(params).map(([name, value]) => ({ name, value })),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`sms.ir responded with HTTP ${res.status}`);
    const body = (await res.json().catch(() => null)) as { status?: number; message?: string } | null;
    if (!body || body.status !== 1) {
      throw new Error(`sms.ir rejected the request (status=${body?.status}, message=${body?.message})`);
    }
  }
}
