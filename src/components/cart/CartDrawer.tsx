"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useTracking } from "@/hooks/useTracking";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore();
  const { trackEvent } = useTracking();
  
  // Para evitar hydration mismatch, usamos un state mounted
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  const total = totalPrice();


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-charcoal/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full md:w-[420px] bg-white border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white">
              <h2 className="font-display text-2xl text-charcoal">
                Tu Carrito <span className="text-gold text-lg">({totalItems()})</span>
              </h2>
              <button
                onClick={closeCart}
                className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 mb-6 rounded-full bg-cream border border-border flex items-center justify-center text-gold/30"
                >
                  <ShoppingBag className="w-10 h-10" />
                </motion.div>
                <h3 className="font-display text-2xl text-charcoal mb-2">Tu carrito está vacío</h3>
                <p className="font-body text-sm text-charcoal-muted mb-8">
                  Aún no has agregado ninguna fragancia a tu carrito.
                </p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="px-8 py-4 rounded-xl border border-gold text-gold font-body font-medium hover:bg-gold/10 transition-colors"
                >
                  Explorar Perfumes
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedMl}`} className="flex gap-3 items-start">
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-cream border border-border shrink-0">
                        <Image
                          src={item.product.images?.[0] || "/hero-perfume.png"}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex flex-col min-w-0">
                            <span className="font-body text-[10px] tracking-widest uppercase text-gold truncate">
                              {item.product.brand?.name}
                            </span>
                            <span className="font-display text-sm text-charcoal leading-tight line-clamp-1">
                              {item.product.name}
                            </span>
                            {item.selectedMl && (
                              <span className="font-body text-[10px] text-charcoal-muted">{item.selectedMl} ml</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              trackEvent("remove_from_cart", {
                                product_id: item.product.id,
                                product_name: item.product.name,
                                brand_name: item.product.brand?.name,
                                price: item.selectedPrice,
                                quantity: item.quantity,
                                ml: item.selectedMl,
                              });
                              removeItem(item.product.id, item.selectedMl);
                            }}
                            className="p-1 text-charcoal-muted hover:text-rose-500 transition-colors rounded shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Aviso mayorista */}
                        {(() => {
                          const mlOption = item.selectedMl
                            ? item.product.ml_options?.find((o) => o.ml === item.selectedMl)
                            : undefined;
                          const basePrice = mlOption ? mlOption.price : item.product.price;
                          const wholesalePrice = mlOption?.wholesale_price ?? item.product.wholesale_price;
                          const totalCartQty = items.reduce((sum, i) => sum + i.quantity, 0);
                          const remaining = 6 - totalCartQty;
                          if (item.selectedPrice < basePrice) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-body text-[10px] font-medium w-fit">
                                ✓ Precio mayorista aplicado
                              </span>
                            );
                          }
                          if (wholesalePrice != null && remaining > 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-body text-[10px] font-medium w-fit">
                                Agrega {remaining} más y activa precio mayorista
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {/* Qty + Price */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center bg-white border border-border rounded-lg h-8 px-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedMl)}
                              className="w-7 h-full flex items-center justify-center text-charcoal hover:text-gold transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-body text-sm text-charcoal font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedMl)}
                              className="w-7 h-full flex items-center justify-center text-charcoal hover:text-gold transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex flex-col items-end">
                            {(() => {
                              const mlOption = item.selectedMl
                                ? item.product.ml_options?.find((o) => o.ml === item.selectedMl)
                                : undefined;
                              const basePrice = mlOption ? mlOption.price : item.product.price;
                              const isWholesale = item.selectedPrice < basePrice;
                              return (
                                <>
                                  {isWholesale && (
                                    <span className="font-body text-[10px] text-charcoal-muted line-through">
                                      ${(basePrice * item.quantity).toLocaleString("es-CO")}
                                    </span>
                                  )}
                                  <span className="font-body font-bold text-sm text-gold">
                                    ${(item.selectedPrice * item.quantity).toLocaleString("es-CO")}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Summary */}
                <div className="border-t border-border bg-white px-4 py-3 flex flex-col gap-2">
                  {/* Summary Lines */}
                  <div className="flex flex-col gap-1 font-body text-xs">
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Subtotal</span>
                      <span>${total.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Envío</span>
                      <span>El costo del envío se calcula por aparte</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border pt-2 mt-1">
                      <span className="text-charcoal text-sm font-medium">Total</span>
                      <span className="font-bold text-lg text-charcoal">${total.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-body font-semibold text-sm text-white bg-charcoal hover:bg-gold transition-colors shadow-sm"
                  >
                    Ir al Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
