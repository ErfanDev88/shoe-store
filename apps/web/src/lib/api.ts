import type { User } from './types';

let accessToken: string | null = null;
let refreshing: Promise<{ user: User } | null> | null = null;

/** The auth store registers here so a silent refresh keeps the UI in sync. */
export const sessionHooks: { onSession?: (user: User | null) => void } = {};
export const setAccessToken = (t: string | null) => { accessToken = t; };

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

function toCode(body: any, status: number): string {
  const m = body?.message;
  if (typeof m === 'string' && /^[A-Z][A-Z0-9_]+$/.test(m)) return m;
  if (Array.isArray(m)) return m.find((x) => typeof x === 'string' && /^[A-Z][A-Z0-9_]+$/.test(x)) ?? 'VALIDATION';
  return ({ 400: 'VALIDATION', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 429: 'TOO_MANY_REQUESTS' } as Record<number, string>)[status] ?? 'UNKNOWN';
}

/** One refresh at a time: the server rotates refresh tokens, so parallel refreshes would invalidate each other. */
export function refreshSession(): Promise<{ user: User } | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) throw new Error('refresh failed');
      const data = (await res.json()) as { accessToken: string; user: User };
      accessToken = data.accessToken;
      sessionHooks.onSession?.(data.user);
      return { user: data.user };
    } catch {
      accessToken = null;
      sessionHooks.onSession?.(null);
      return null;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

type Init = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit };

async function send(path: string, init: Init) {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`/api${path}`, {
    ...init, headers, credentials: 'same-origin',
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
}

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  let res = await send(path, init);
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await send(path, init);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, toCode(body, res.status));
  return body as T;
}

/** SWR fetcher (authenticated). */
export const fetcher = <T,>(path: string) => api<T>(path);

/** Used by server components (no auth, never cached so stock/prices are always fresh). */
export async function serverApi<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.API_URL ?? 'http://localhost:4000'}/api${path}`, { cache: 'no-store' });
  if (!res.ok) throw new ApiError(res.status, 'SERVER_FETCH_FAILED');
  return res.json() as Promise<T>;
}

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : '';
}
