"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserWishlist, removeFromWishlist } from "@/lib/supabase/account";
import { useCartStore } from "@/lib/store/cart";
import type { WishlistItem } from "@/types";
import { useTracking } from "@/hooks/useTracking";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const { trackEvent } = useTracking();

  useEffect(() => {
    if (!user) return;
    getUserWishlist(user.id)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (item: WishlistItem) => {
    if (!user || removing) return;

    // Respaldar el estado anterior en caso de que debamos revertirlo
    const previousItems = [...items];

    // Actualización optimista: removemos visualmente de inmediato
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setRemoving(item.product_id);

    try {
      await removeFromWishlist(user.id, item.product_id);
      toast.success("Eliminado de tu wishlist");
      trackEvent("wishlist_remove", {
        product_id: item.product_id,
        product_name: item.product?.name,
        brand_name: item.product?.brand?.name,
        price: item.product?.price,
      });
    } catch {
      // Revertir estado si falla la transacción en Supabase
      setItems(previousItems);
      toast.error("Error al eliminar de la wishlist");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product) return;
    addItem(item.product);
    toast.success(`${item.product.name} agregado al carrito`);
    trackEvent("add_to_cart", {
      product_id: item.product_id,
      product_name: item.product.name,
      brand_name: item.product.brand?.name,
      price: item.product.price,
      quantity: 1,
    });
  };

  if (authLoading || loading) {
    return (
      <div>
        <div className="h-8 w-40 bg-cream rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-cream rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-charcoal mb-1">Mi Wishlist</h1>
        <p className="font-body text-sm text-charcoal-muted">
          {items.length === 0
            ? "Tu lista de deseos está vacía"
            : `${items.length} producto${items.length !== 1 ? "s" : ""} guardado${items.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm"
        >
          <Heart className="w-12 h-12 text-gold mx-auto mb-4" />
          <p className="font-display text-lg text-charcoal mb-2">
            Tu wishlist está vacía
          </p>
          <p className="font-body text-sm text-charcoal-muted mb-6">
            Guarda tus fragancias favoritas para no perderlas de vista.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body font-semibold text-sm hover:bg-gold transition-colors"
          >
            Explorar Catálogo
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const product = item.product;
            if (!product) return null;
            const img = product.images?.[0] || null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-border rounded-2xl overflow-hidden group hover:border-gold transition-all shadow-sm"
              >
                {/* Image */}
                <div className="relative aspect-square bg-cream">
                  {img ? (
                    <Image
                      src={img}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gold/20" />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removing === item.product_id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-charcoal-muted hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {removing === item.product_id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  {product.brand && (
                    <p className="font-body text-[10px] uppercase tracking-widest text-gold/60 mb-0.5">
                      {product.brand.name}
                    </p>
                  )}
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-body text-sm text-charcoal hover:text-gold transition-colors line-clamp-2 leading-snug mb-2 font-medium"
                  >
                    {product.name}
                  </Link>
                  <p className="font-display text-base text-gold mb-3">
                    {formatCOP(product.price)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-cream border border-border text-charcoal rounded-lg font-body text-xs hover:bg-gold hover:text-white hover:border-gold transition-colors font-medium"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    Agregar al carrito
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
