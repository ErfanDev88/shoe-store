import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { sanitizeMiddleware } from './common/middleware/sanitize.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // only trust X-Forwarded-For when really behind a proxy, otherwise IP rate limits can be spoofed
  if (config.get<boolean>('TRUST_PROXY')) app.set('trust proxy', 1);

  app.disable('x-powered-by');
  // uploaded product images are loaded by the web app from another origin/port
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.use(sanitizeMiddleware);

  app.useStaticAssets(resolve(process.cwd(), config.get<string>('UPLOAD_DIR')!), {
    prefix: '/uploads',
    maxAge: '7d',
    dotfiles: 'deny',
    index: false,
  });

  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')!.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const port = config.get<number>('PORT')!;
  await app.listen(port);
  new Logger('Bootstrap').log(`API running on http://localhost:${port}/api`);
}

bootstrap();
