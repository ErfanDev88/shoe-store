'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

interface WishlistState {
  ids: string[];
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  clear: () => void;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  ids: [],
  load: async () => set({ ids: await api<string[]>('/wishlist/ids') }),
  toggle: async (id) => {
    const has = get().ids.includes(id);
    set({ ids: has ? await api<string[]>(`/wishlist/${id}`, { method: 'DELETE' }) : await api<string[]>(`/wishlist/${id}`, { method: 'POST' }) });
  },
  clear: () => set({ ids: [] }),
}));
