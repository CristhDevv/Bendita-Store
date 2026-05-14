"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ShoppingBag, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/types";

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedMl, setSelectedMl] = useState(product.ml_options?.[0]?.ml || 100);
  const addItem = useCartStore(s => s.addItem);

  const images = product.images?.length ? product.images : ["/hero-perfume.png"];

  const handleAdd = () => {
    addItem(product, 1, selectedMl);
    toast.success(`${product.name} (${selectedMl}ml) añadido al carrito`, { icon: "🛍️" });
    onClose();
  };

  const discountPct = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] bg-white border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            style={/* For centered fallback if translate fails */ { margin: "auto" }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal hover:bg-border transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Images */}
            <div className="w-full md:w-1/2 bg-cream p-6 flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                {discountPct && (
                  <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    -{discountPct}%
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx ? "border-gold" : "border-border hover:border-gold"
                      }`}
                    >
                      <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-6 md:p-8 md:pl-10 flex flex-col overflow-y-auto max-h-[90vh]">
              <span className="font-body text-xs tracking-[0.2em] uppercase text-gold-400 mb-2">
                {product.brand?.name}
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-charcoal mb-3">
                {product.name}
              </h2>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
                <span className="font-body text-xs text-charcoal-muted ml-2">(4.9/5)</span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-8">
                <span className="font-body font-bold text-2xl text-gold">
                  ${product.price.toLocaleString("es-CO")}
                </span>
                {product.compare_price && (
                  <span className="font-body text-sm text-charcoal-muted line-through mb-1">
                    ${product.compare_price.toLocaleString("es-CO")}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="font-body text-sm text-charcoal-muted mb-8 leading-relaxed line-clamp-3">
                {product.description || "Una fragancia excepcional diseñada para cautivar los sentidos. Elaborada con los ingredientes más puros y duraderos."}
              </p>

              {/* ML Selector */}
              {product.ml_options && product.ml_options.length > 0 && (
                <div className="mb-8">
                  <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-3">Tamaño</p>
                  <div className="flex gap-3">
                    {product.ml_options.map(opt => (
                      <button
                        key={opt.ml}
                        onClick={() => setSelectedMl(opt.ml)}
                        className={`px-4 py-2 rounded-xl text-sm font-body transition-all ${
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

              {/* Olfactive Notes */}
              {(product.notes_top || product.notes_heart || product.notes_base) && (
                <div className="mb-8 flex flex-col gap-3">
                  <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-1">Notas Olfativas</p>
                  
                  {product.notes_top && product.notes_top.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="font-body text-[10px] text-charcoal-muted uppercase w-14">Salida</span>
                      <div className="flex flex-wrap gap-2">
                        {product.notes_top.map(n => <span key={n} className="px-2 py-1 rounded bg-white text-charcoal text-xs border border-border shadow-sm">{n}</span>)}
                      </div>
                    </div>
                  )}
                  {product.notes_heart && product.notes_heart.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="font-body text-[10px] text-charcoal-muted uppercase w-14">Corazón</span>
                      <div className="flex flex-wrap gap-2">
                        {product.notes_heart.map(n => <span key={n} className="px-2 py-1 rounded bg-white text-charcoal text-xs border border-border shadow-sm">{n}</span>)}
                      </div>
                    </div>
                  )}
                  {product.notes_base && product.notes_base.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="font-body text-[10px] text-charcoal-muted uppercase w-14">Fondo</span>
                      <div className="flex flex-wrap gap-2">
                        {product.notes_base.map(n => <span key={n} className="px-2 py-1 rounded bg-white text-charcoal text-xs border border-border shadow-sm">{n}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto pt-6 flex flex-col gap-3">
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-body font-semibold text-white transition-all hover:scale-[1.02] bg-charcoal hover:bg-gold shadow-sm"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Agregar al carrito
                </button>
                <Link
                  href={`/product/${product.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-cream border border-border text-charcoal font-body hover:bg-gold hover:text-white hover:border-gold transition-colors shadow-sm"
                >
                  Ver producto completo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
