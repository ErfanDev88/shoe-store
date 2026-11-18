'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/stores/auth';

/** Redirects guests to the login page (and back afterwards). */
export function useRequireAuth(roles?: string[]) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === 'guest') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === 'authed' && roles && user && !roles.includes(user.role)) router.replace('/');
  }, [status, user, roles, pathname, router]);
  return status === 'authed' && (!roles || (user && roles.includes(user.role))) ? user : null;
}

/** Only allows same-site relative redirects (prevents open-redirect abuse of ?next=). */
export const safeNext = (n: string | null) => (n && /^\/(?!\/)[\w\-./?=&%]*$/.test(n) ? n : null);
