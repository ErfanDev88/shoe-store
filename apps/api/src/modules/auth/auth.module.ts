import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsModule } from '../notifications/sms/sms.module';
import { UsersModule } from '../users/users.module';
import { AccountTokensService } from './account-tokens.service';
import { AuthToken, AuthTokenSchema } from './schemas/auth-token.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { RefreshSession, RefreshSessionSchema } from './schemas/refresh-session.schema';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    JwtModule.register({}), // secrets/options are passed per call in TokensService
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: AuthToken.name, schema: AuthTokenSchema },
    ]),
    UsersModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokensService, AccountTokensService],
  exports: [TokensService], // used by the global JwtAuthGuard
})
export class AuthModule {}
