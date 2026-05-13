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
    addItem(product, 1);
    toast.success(`${product.name} añadido`, { icon: "🛍️" });
  };

  return (
    <article className="group flex flex-col gap-3">
      {/* Image */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-navy-900 border border-white/5">
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
            <span className="bg-navy-950/80 backdrop-blur-sm text-gold text-[10px] px-2 py-1 rounded-full uppercase tracking-widest">
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
          className="absolute inset-0 bg-navy-950/60 flex flex-col items-center justify-center gap-3"
        >
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setIsQuickViewOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/20 text-crystal text-sm font-body hover:border-gold-500/50 hover:text-gold transition-colors"
          >
            <Eye className="w-4 h-4" /> Vista Rápida
          </button>
          <button
            onClick={e => { e.preventDefault(); }}
            className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-crystal hover:text-gold hover:border-gold-500/50 transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <span className="font-body text-[10px] tracking-widest uppercase text-gold-400/80">
          {product.brand?.name}
        </span>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-display text-lg text-crystal hover:text-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-body font-bold text-crystal text-sm">
            ${product.price.toLocaleString("es-CO")}
          </span>
          {product.compare_price && (
            <span className="font-body text-xs text-crystal/40 line-through">
              ${product.compare_price.toLocaleString("es-CO")}
            </span>
          )}
        </div>
      </div>

      {/* Add to cart — always visible mobile, hover-only desktop */}
      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body text-sm font-medium text-navy-950 transition-all
          md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:transition-all md:duration-300"
        style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
      >
        <ShoppingBag className="w-4 h-4" />
        Agregar al carrito
      </button>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </article>
  );
}
