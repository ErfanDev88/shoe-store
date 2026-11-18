import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleSmsProvider } from './console-sms.provider';
import { SmsProvider } from './sms.provider';
import { SmsIrProvider } from './smsir.provider';

@Module({
  providers: [
    {
      provide: SmsProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SmsProvider =>
        config.get('SMS_PROVIDER') === 'smsir'
          ? new SmsIrProvider(
              config.get<string>('SMSIR_API_KEY')!,
              Number(config.get<string>('SMSIR_OTP_TEMPLATE_ID')),
            )
          : new ConsoleSmsProvider(),
    },
  ],
  exports: [SmsProvider],
})
export class SmsModule {}
