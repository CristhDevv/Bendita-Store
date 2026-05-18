import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

// Helper para recalcular precios según la regla de mayorista
function recalculateCartPrices(items: CartItem[]): CartItem[] {
  // 1. Agrupar cantidades totales por product.id
  const totalCartQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // 2. Mapear items y aplicar precio mayorista si la cantidad total >= 6
  return items.map((item) => {
    const isWholesale = totalCartQty >= 6;
    
    // Obtener precios de variante si existe
    const mlOption = item.selectedMl 
      ? item.product.ml_options?.find((o) => o.ml === item.selectedMl)
      : undefined;

    let newPrice = mlOption ? mlOption.price : item.product.price;

    if (isWholesale) {
      // Buscar wholesale_price en variante, o en el base, o fallback al normal
      const wholesale = mlOption?.wholesale_price ?? item.product.wholesale_price;
      if (wholesale != null) {
        newPrice = wholesale;
      }
    }

    return { ...item, selectedPrice: newPrice };
  });
}

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

          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              i.product.id === product.id && i.selectedMl === ml
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          } else {
            newItems = [
              ...state.items,
              // selectedPrice será recalculado y asignado por recalculateCartPrices
              { product, quantity, selectedMl: ml, selectedPrice: 0 },
            ];
          }

          return { items: recalculateCartPrices(newItems) };
        });
      },

      removeItem: (productId, ml) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.product.id === productId && i.selectedMl === ml)
          );
          return { items: recalculateCartPrices(newItems) };
        });
      },

      updateQuantity: (productId, quantity, ml) => {
        if (quantity <= 0) {
          get().removeItem(productId, ml);
          return;
        }
        set((state) => {
          const newItems = state.items.map((i) =>
            i.product.id === productId && i.selectedMl === ml
              ? { ...i, quantity }
              : i
          );
          return { items: recalculateCartPrices(newItems) };
        });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = recalculateCartPrices(state.items);
        }
      },
    }
  )
);
