/** Abstraction so the SMS gateway can be swapped without touching business code. */
export abstract class SmsProvider {
  abstract sendTemplate(phone: string, templateId: number, params: Record<string, string>): Promise<void>;
  abstract sendOtp(phone: string, code: string): Promise<void>;
}
