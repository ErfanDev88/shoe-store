import { NextFunction, Request, Response } from 'express';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Removes Mongo operator keys ($...), dotted keys and prototype-pollution keys from input. */
function clean(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) {
      delete obj[key];
      continue;
    }
    clean(obj[key]);
  }
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}
