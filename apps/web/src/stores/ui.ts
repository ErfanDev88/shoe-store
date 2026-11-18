'use client';
import { create } from 'zustand';

interface UiState { cartOpen: boolean; openCart: () => void; closeCart: () => void; searchOpen: boolean; setSearch: (v: boolean) => void }

export const useUi = create<UiState>((set) => ({
  cartOpen: false, openCart: () => set({ cartOpen: true }), closeCart: () => set({ cartOpen: false }),
  searchOpen: false, setSearch: (v) => set({ searchOpen: v }),
}));
