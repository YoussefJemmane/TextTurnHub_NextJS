"use client";

import { create } from "zustand";

interface CartStore {
  cartCount: number;
  setCartCount: (count: number) => void;
  incrementCartCount: () => void;
  decrementCartCount: () => void;
  refreshCartCount: () => Promise<void>;
}

const useCart = create<CartStore>((set) => ({
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
  incrementCartCount: () =>
    set((state) => ({ cartCount: state.cartCount + 1 })),
  decrementCartCount: () =>
    set((state) => ({ cartCount: Math.max(0, state.cartCount - 1) })),
  refreshCartCount: async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const cartItems = await response.json();
        set({ cartCount: cartItems.length });
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  },
}));

export default useCart;
