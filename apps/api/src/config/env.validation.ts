import * as Joi from 'joi';

const secret = Joi.string()
  .min(32)
  .required()
  .custom((value: string, helpers) =>
    value.startsWith('change-me')
      ? helpers.message({ custom: 'must be replaced with a real random secret' })
      : value,
  );
const optional = Joi.string().optional().allow('');

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4000),
  MONGODB_URI: Joi.string().required(),
  CORS_ORIGINS: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  TRUST_PROXY: Joi.boolean().default(false),
  UPLOAD_DIR: Joi.string().default('uploads'),

  JWT_ACCESS_SECRET: secret,
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  REFRESH_TTL_DAYS: Joi.number().integer().min(1).max(90).default(30),
  OTP_HMAC_SECRET: secret,

  SMS_PROVIDER: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.valid('smsir').required(),
    otherwise: Joi.valid('console', 'smsir').default('console'),
  }),
  SMSIR_API_KEY: Joi.string().when('SMS_PROVIDER', { is: 'smsir', then: Joi.required(), otherwise: optional }),
  SMSIR_OTP_TEMPLATE_ID: Joi.string().when('SMS_PROVIDER', {
    is: 'smsir',
    then: Joi.string().pattern(/^\d+$/).required(),
    otherwise: optional,
  }),
  SMSIR_ORDER_TEMPLATE_ID: Joi.string().pattern(/^\d*$/).optional().allow(''),

  ZARINPAL_MERCHANT_ID: Joi.string().allow('').when('NODE_ENV', {
    is: 'production',
    then: Joi.string().length(36).required(),
  }),
  ZARINPAL_SANDBOX: Joi.boolean().default(true),

  SMTP_HOST: optional,
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  SMTP_FROM: optional,

  ADMIN_PHONE: optional,
  ADMIN_EMAIL: optional,
  ADMIN_PASSWORD: optional,
});
