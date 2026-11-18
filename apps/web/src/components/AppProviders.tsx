'use client';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';
import { useWishlist } from '@/stores/wishlist';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const status = useAuth((s) => s.status);
  const { resolvedTheme } = useTheme();

  useEffect(() => { useAuth.getState().bootstrap(); }, []);

  useEffect(() => {
    if (status === 'authed') {
      useCart.getState().mergeGuest().catch(() => undefined); // moves the browser cart into the account
      useWishlist.getState().load().catch(() => undefined);
    } else if (status === 'guest') {
      useWishlist.getState().clear();
      useCart.getState().load();
    }
  }, [status]);

  return (<>{children}<Toaster richColors position="top-center" theme={resolvedTheme === 'dark' ? 'dark' : 'light'} /></>);
}
