"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/format";

import { MOCK_PRODUCTS } from "@/lib/mock/products";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`${product.name} añadido al carrito`, { icon: "🛍️" });
  };

  return (
    <motion.div variants={itemVariants} className="group flex flex-col gap-3">
      <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-border shadow-sm">
        <Image src={product.images?.[0] ?? "/hero-perfume.png"} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3">
          {product.concentration && (
            <span className="bg-cream text-charcoal text-[10px] px-2 py-1 rounded-full uppercase tracking-widest border border-border shadow-sm">
              {product.concentration}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-charcoal-muted hover:text-gold hover:border-gold transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 shadow-sm" aria-label="Wishlist">
          <Heart className="w-4 h-4" />
        </button>

        {/* Add button icon-only on hover */}
        <button onClick={handleAdd} aria-label="Agregar" className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-charcoal text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-gold shadow-sm">
          <Plus className="w-5 h-5" />
        </button>
      </Link>

      <div className="flex flex-col px-1">
        <span className="text-[10px] tracking-widest text-charcoal-muted uppercase">{product.brand?.name}</span>
        <Link href={`/product/${product.slug}`} className="font-display text-lg text-charcoal hover:text-gold transition-colors line-clamp-1">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-body font-semibold text-gold text-sm">
            ${formatPrice(product.price)}
          </span>
          {product.compare_price && (
            <span className="font-body text-xs text-charcoal-muted line-through">
              ${formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedProducts() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center mb-16">
          <h2 className="font-display text-4xl text-charcoal">Más Deseados</h2>
          <div className="h-0.5 w-16 bg-gold mt-4 rounded-full" />
        </div>

        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
        >
          {MOCK_PRODUCTS.map((p) => <ProductCard key={p.id} product={p} />)}
        </motion.div>
      </div>
    </section>
  );
}
