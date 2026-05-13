"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const [selectedMl, setSelectedMl] = useState(product.ml_options?.[0]?.ml || 100);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);

  const price = product.ml_options?.find(o => o.ml === selectedMl)?.price || product.price;

  const handleAdd = () => {
    addItem(product, quantity, selectedMl);
    toast.success(`${quantity} x ${product.name} añadido al carrito`, { icon: "🛍️" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ML Selector */}
      {product.ml_options && product.ml_options.length > 0 && (
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-crystal/50 mb-3">Tamaño (ML)</p>
          <div className="flex flex-wrap gap-3">
            {product.ml_options.map(opt => (
              <button
                key={opt.ml}
                onClick={() => setSelectedMl(opt.ml)}
                className={`px-5 py-2.5 rounded-xl text-sm font-body transition-all ${
                  selectedMl === opt.ml
                    ? "bg-gold text-navy-950 font-semibold"
                    : "border border-white/20 text-crystal hover:border-gold-500/50"
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
        <p className="font-body text-xs uppercase tracking-widest text-crystal/50">Cantidad</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-navy-900 border border-white/10 rounded-xl h-[56px] px-2">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-crystal hover:text-gold transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              readOnly
              className="w-12 bg-transparent text-center font-body text-lg text-crystal font-medium outline-none"
            />
            <button
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-crystal hover:text-gold transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex-1 h-[56px] flex items-center justify-center gap-2 rounded-xl font-body font-semibold text-navy-950 transition-transform hover:scale-[1.02] shadow-xl shadow-gold/20"
            style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
          >
            <ShoppingBag className="w-5 h-5" />
            Agregar al carrito
          </button>
        </div>

        <button className="h-[56px] flex items-center justify-center gap-2 rounded-xl border border-gold-500/40 text-gold font-body font-medium hover:bg-gold-500/10 transition-colors">
          <Heart className="w-5 h-5" />
          Agregar a Wishlist
        </button>
      </div>
    </div>
  );
}
