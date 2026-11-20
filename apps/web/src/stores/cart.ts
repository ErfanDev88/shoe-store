'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { CartLine, CartView } from '@/lib/types';
import { useAuth } from './auth';

const EMPTY: CartView = { lines: [], itemCount: 0, subtotal: 0, discount: 0, totalWeightGram: 0 };

function guestView(lines: CartLine[]): CartView {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return {
    lines: lines.map((l) => ({ ...l, lineTotal: l.unitPrice * l.quantity, available: l.stock >= l.quantity })),
    itemCount: lines.reduce((n, l) => n + l.quantity, 0), subtotal, discount: 0,
    totalWeightGram: lines.reduce((w, l) => w + l.weightGram * l.quantity, 0),
  };
}

interface CartState {
  view: CartView;
  guest: CartLine[]; // persisted in the browser until login
  load: () => Promise<void>;
  add: (line: CartLine) => Promise<void>;
  setQty: (sku: string, quantity: number) => Promise<void>;
  remove: (sku: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  mergeGuest: () => Promise<void>;
  reset: () => void;
}

const authed = () => useAuth.getState().status === 'authed';

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      view: EMPTY,
      guest: [],
      load: async () => {
        if (authed()) set({ view: await api<CartView>('/cart') });
        else set({ view: guestView(get().guest) });
      },
      add: async (line) => {
        if (authed()) {
          set({ view: await api<CartView>('/cart/items', { method: 'POST', json: { productId: line.productId, sku: line.sku, quantity: line.quantity } }) });
          return;
        }
        const guest = [...get().guest];
        const ex = guest.find((g) => g.sku === line.sku);
        const qty = (ex?.quantity ?? 0) + line.quantity;
        if (qty > Math.min(10, line.stock)) throw Object.assign(new Error('INSUFFICIENT_STOCK'), { code: 'INSUFFICIENT_STOCK' });
        if (ex) ex.quantity = qty; else guest.push(line);
        set({ guest, view: guestView(guest) });
      },
      setQty: async (sku, quantity) => {
        if (authed()) { set({ view: await api<CartView>(`/cart/items/${encodeURIComponent(sku)}`, { method: 'PATCH', json: { quantity } }) }); return; }
        const guest = get().guest.map((g) => (g.sku === sku ? { ...g, quantity: Math.min(quantity, g.stock, 10) } : g));
        set({ guest, view: guestView(guest) });
      },
      remove: async (sku) => {
        if (authed()) { set({ view: await api<CartView>(`/cart/items/${encodeURIComponent(sku)}`, { method: 'DELETE' }) }); return; }
        const guest = get().guest.filter((g) => g.sku !== sku);
        set({ guest, view: guestView(guest) });
      },
applyCoupon: async (code) => {
  const view = await api<CartView>('/cart/coupon', {
    method: 'POST',
    json: { code }
  });

  set({ view });
},      
removeCoupon: async () => {
  const view = await api<CartView>('/cart/coupon', {
    method: 'DELETE'
  });

  set({ view });
},
      mergeGuest: async () => {
        const { guest } = get();
        if (guest.length) {
          const items = guest.map((g) => ({ productId: g.productId, sku: g.sku, quantity: g.quantity }));
          set({ view: await api<CartView>('/cart/merge', { method: 'POST', json: { items } }), guest: [] });
        } else await get().load();
      },
      reset: () => set({ view: EMPTY, guest: [] }),
    }),
    { name: 'shoe-guest-cart', partialize: (s) => ({ guest: s.guest }) },
  ),
);
