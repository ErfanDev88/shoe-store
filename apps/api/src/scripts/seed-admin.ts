import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { normalizeIranMobile } from '../common/utils/phone.util';
import { hashPassword } from '../common/utils/password.util';
import { UsersService } from '../modules/users/users.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const config = app.get(ConfigService);

  const phone = normalizeIranMobile(config.get<string>('ADMIN_PHONE') ?? '');
  if (!phone) throw new Error('ADMIN_PHONE is missing or is not a valid Iranian mobile number');

  const email = config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase() || undefined;
  const password = config.get<string>('ADMIN_PASSWORD') || undefined;
  if (password && password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

  const admin = await app.get(UsersService).ensureAdmin(
    phone,
    email,
    password ? await hashPassword(password) : undefined,
  );
  console.log(`Admin ready: ${admin?.phone}${email ? ` / ${email}` : ''}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
