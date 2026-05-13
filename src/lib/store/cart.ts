import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  // Acciones
  addItem: (product: Product, quantity?: number, ml?: number) => void;
  removeItem: (productId: string, ml?: number) => void;
  updateQuantity: (productId: string, quantity: number, ml?: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1, ml) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product.id === product.id && i.selectedMl === ml
          );

          const selectedPrice = ml
            ? (product.ml_options?.find((o) => o.ml === ml)?.price ?? product.price)
            : product.price;

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id && i.selectedMl === ml
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { product, quantity, selectedMl: ml, selectedPrice },
            ],
          };
        });
      },

      removeItem: (productId, ml) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.selectedMl === ml)
          ),
        }));
      },

      updateQuantity: (productId, quantity, ml) => {
        if (quantity <= 0) {
          get().removeItem(productId, ml);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.selectedMl === ml
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + i.selectedPrice * i.quantity,
          0
        ),
    }),
    {
      name: "bendita-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
