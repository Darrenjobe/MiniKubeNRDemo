import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth' }
  )
);

export const useCartStore = create((set, get) => ({
  items: [],
  count: 0,
  setCart: (items) => set({ items, count: items.length }),
  addLocalItem: (item) => {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.productId === item.productId);
    if (idx >= 0) items[idx].quantity += item.quantity;
    else items.push(item);
    set({ items, count: items.length });
  },
  clearLocal: () => set({ items: [], count: 0 }),
}));
