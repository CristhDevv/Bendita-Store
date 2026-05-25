"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types";
import { useTracking } from "@/hooks/useTracking";
import { useAuth } from "@/hooks/useAuth";
import { addToWishlist } from "@/lib/supabase/account";

export function ProductActions({ product }: { product: Product }) {
  const [selectedMl, setSelectedMl] = useState(product.ml_options?.[0]?.ml || 100);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);
  const { trackEvent } = useTracking();
  const { user } = useAuth();
  const [isWishlisting, setIsWishlisting] = useState(false);

  const selectedMlOption = product.ml_options?.find(o => o.ml === selectedMl);
  const wholesalePrice = selectedMlOption?.wholesale_price ?? product.wholesale_price;

  const handleAdd = () => {
    addItem(product, quantity, selectedMl);
    toast.success(`${quantity} x ${product.name} añadido al carrito`, { icon: "🛍️" });
    trackEvent("add_to_cart", {
      product_id: product.id,
      product_name: product.name,
      brand_name: product.brand?.name,
      price: selectedMlOption?.price ?? product.price,
      quantity,
      ml: selectedMl,
    });
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error("Por favor inicia sesión para guardar fragancias en tu wishlist");
      return;
    }
    setIsWishlisting(true);
    try {
      await addToWishlist(user.id, product.id);
      toast.success("Añadido a tu wishlist", { icon: "❤️" });
      trackEvent("wishlist_add", {
        product_id: product.id,
        product_name: product.name,
        brand_name: product.brand?.name,
        price: product.price,
      });
    } catch {
      toast.error("Error al añadir a tu wishlist");
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {wholesalePrice != null && (
        <div className="flex items-center gap-2 -mt-4 mb-2">
          <span className="font-body text-sm font-semibold text-charcoal-muted bg-cream px-3 py-1 rounded-md border border-border">
            Precio mayorista: <span className="text-gold">${formatPrice(wholesalePrice)}</span> desde 6 unidades
          </span>
        </div>
      )}

      {/* ML Selector */}
      {product.ml_options && product.ml_options.length > 0 && (
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-3">Tamaño (ML)</p>
          <div className="flex flex-wrap gap-3">
            {product.ml_options.map(opt => (
              <button
                key={opt.ml}
                onClick={() => setSelectedMl(opt.ml)}
                className={`px-5 py-2.5 rounded-xl text-sm font-body transition-all ${
                  selectedMl === opt.ml
                    ? "bg-charcoal text-white font-semibold shadow-sm"
                    : "bg-white border border-border text-charcoal hover:border-gold hover:text-gold shadow-sm"
                }`}
              >
                {opt.ml} ml
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Buttons */}
      <div className="flex flex-col gap-4">
        <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted">Cantidad</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-border rounded-xl h-[56px] px-2 shadow-sm">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              readOnly
              className="w-12 bg-transparent text-center font-body text-lg text-charcoal font-medium outline-none"
            />
            <button
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex-1 h-[56px] flex items-center justify-center gap-2 rounded-xl font-body font-semibold text-white bg-charcoal hover:bg-gold transition-all hover:scale-[1.02] shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            Agregar al carrito
          </button>
        </div>

        <button
          onClick={handleWishlist}
          disabled={isWishlisting}
          className="h-[56px] flex items-center justify-center gap-2 rounded-xl bg-cream border border-border text-charcoal font-body hover:border-gold hover:text-gold transition-colors shadow-sm disabled:opacity-50"
        >
          <Heart className={`w-5 h-5 ${isWishlisting ? "animate-pulse" : ""}`} />
          {isWishlisting ? "Agregando..." : "Agregar a Wishlist"}
        </button>
      </div>
    </div>
  );
}
