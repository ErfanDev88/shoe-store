import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Zarinpal REST v4. Amounts are sent in Toman (currency "IRT").
 * Please double-check field names against https://docs.zarinpal.com before going live.
 */
@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);
  private readonly merchant: string;
  private readonly api: string;
  private readonly startPay: string;

  constructor(config: ConfigService) {
    const sandbox = config.get<boolean>('ZARINPAL_SANDBOX');
    const host = sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com';
    this.merchant = config.get<string>('ZARINPAL_MERCHANT_ID') ?? '';
    this.api = `https://${host}/pg/v4/payment`;
    this.startPay = `https://${host}/pg/StartPay/`;
  }

  private async post(path: 'request' | 'verify', body: Record<string, unknown>) {
    if (!this.merchant) throw new ServiceUnavailableException('PAYMENT_NOT_CONFIGURED');
    try {
      const res = await fetch(`${this.api}/${path}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ merchant_id: this.merchant, ...body }),
        signal: AbortSignal.timeout(15000),
      });
      return (await res.json().catch(() => null)) as { data?: Record<string, any>; errors?: unknown } | null;
    } catch (e) {
      this.logger.error(`Zarinpal ${path} failed: ${(e as Error).message}`);
      throw new ServiceUnavailableException('PAYMENT_GATEWAY_ERROR');
    }
  }

  async request(amount: number, description: string, callbackUrl: string, meta: { mobile?: string; email?: string }) {
    const json = await this.post('request', { amount, currency: 'IRT', description, callback_url: callbackUrl, metadata: meta });
    const authority = json?.data?.authority as string | undefined;
    if (json?.data?.code !== 100 || !authority) {
      this.logger.error(`Zarinpal request rejected: ${JSON.stringify(json?.errors ?? json)}`);
      throw new ServiceUnavailableException('PAYMENT_GATEWAY_ERROR');
    }
    return { authority, url: this.startPay + authority };
  }

  async verify(authority: string, amount: number) {
    const json = await this.post('verify', { amount, authority });
    const code = json?.data?.code;
    return { ok: code === 100 || code === 101, refId: json?.data?.ref_id ? String(json.data.ref_id) : undefined, cardPan: json?.data?.card_pan as string | undefined };
  }
}
