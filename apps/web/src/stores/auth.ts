'use client';
import { create } from 'zustand';
import { api, refreshSession, sessionHooks, setAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  status: 'loading' | 'authed' | 'guest';
  bootstrap: () => Promise<void>;
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  bootstrap: async () => {
    const r = await refreshSession();
    set(r ? { user: r.user, status: 'authed' } : { user: null, status: 'guest' });
  },
  setSession: (user, token) => { setAccessToken(token); set({ user, status: 'authed' }); },
  setUser: (user) => set({ user }),
  logout: async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setAccessToken(null);
    set({ user: null, status: 'guest' });
  },
}));

// a silent refresh (or its failure) updates the store
sessionHooks.onSession = (user) =>
  useAuth.setState(user ? { user, status: 'authed' } : { user: null, status: 'guest' });
