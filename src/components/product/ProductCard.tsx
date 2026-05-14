"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import dynamic from "next/dynamic";

const QuickViewModal = dynamic(() => import("@/components/product/QuickViewModal").then(mod => mod.QuickViewModal), { ssr: false });
import type { Product } from "@/types";

const CONC_LABEL: Record<string, string> = {
  parfum: "Parfum", edp: "EDP", edt: "EDT", edc: "EDC", splash: "Splash",
};

export function ProductCard({ product }: { product: Product }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const discountPct = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} añadido`, { icon: "🛍️" });
  };

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3 bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-cream-dark transition-all">
      <article>
        {/* Image */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cream border border-border">
          <Image
            src={product.images?.[0] ?? "/hero-perfume.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3">
            {product.concentration && (
              <span className="bg-cream-dark text-charcoal-muted text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-medium">
                {CONC_LABEL[product.concentration]}
              </span>
            )}
          </div>
          {discountPct && (
            <div className="absolute top-3 right-3">
              <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                -{discountPct}%
              </span>
            </div>
          )}

          {/* Hover overlay with actions */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setIsQuickViewOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white shadow-sm border border-border text-charcoal text-sm font-body hover:border-gold hover:text-gold transition-colors"
            >
              <Eye className="w-4 h-4" /> Vista Rápida
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-border flex items-center justify-center text-charcoal hover:text-gold hover:border-gold transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 px-1 mt-3">
          <span className="font-body text-[10px] tracking-widest uppercase text-gold font-semibold">
            {product.brand?.name}
          </span>
          <h3 className="font-display text-lg text-charcoal group-hover:text-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-body font-bold text-charcoal text-sm">
              ${product.price.toLocaleString("es-CO")}
            </span>
            {product.compare_price && (
              <span className="font-body text-xs text-charcoal-muted line-through">
                ${product.compare_price.toLocaleString("es-CO")}
              </span>
            )}
          </div>
        </div>

        {/* Add to cart — always visible mobile, hover-only desktop */}
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl font-body text-sm font-medium bg-charcoal text-white hover:bg-gold transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          Agregar al carrito
        </button>
      </article>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </Link>
  );
}
