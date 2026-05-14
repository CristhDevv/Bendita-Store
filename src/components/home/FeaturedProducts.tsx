"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/types";

/* ─── Mock data (replaced by Supabase later) ─── */
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Oud Royal Noir", slug: "oud-royal-noir", price: 320000, compare_price: 420000, brand: { id: "b1", name: "Dior", slug: "dior" }, concentration: "edp", images: ["/hero-perfume.png"], stock: 12, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "2", name: "Jasmine Lumière", slug: "jasmine-lumiere", price: 280000, brand: { id: "b2", name: "Chanel", slug: "chanel" }, concentration: "parfum", images: ["/hero-perfume.png"], stock: 8, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "3", name: "Cedar & Vetiver", slug: "cedar-vetiver", price: 195000, compare_price: 250000, brand: { id: "b3", name: "Tom Ford", slug: "tom-ford" }, concentration: "edt", images: ["/hero-perfume.png"], stock: 20, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "4", name: "Rose Céleste", slug: "rose-celeste", price: 345000, brand: { id: "b4", name: "Creed", slug: "creed" }, concentration: "parfum", images: ["/hero-perfume.png"], stock: 5, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "5", name: "Santal 33 Intense", slug: "santal-33", price: 410000, brand: { id: "b5", name: "Le Labo", slug: "le-labo" }, concentration: "edp", images: ["/hero-perfume.png"], stock: 15, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "6", name: "Aqua Universalis", slug: "aqua-universalis", price: 215000, compare_price: 260000, brand: { id: "b6", name: "Maison Francis Kurkdjian", slug: "mfk" }, concentration: "edt", images: ["/hero-perfume.png"], stock: 25, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "7", name: "Baccarat Rouge", slug: "baccarat-rouge", price: 580000, brand: { id: "b6", name: "Maison Francis Kurkdjian", slug: "mfk" }, concentration: "edp", images: ["/hero-perfume.png"], stock: 4, is_featured: true, is_active: true, created_at: new Date().toISOString() },
  { id: "8", name: "Tobacco Vanille", slug: "tobacco-vanille", price: 390000, compare_price: 450000, brand: { id: "b3", name: "Tom Ford", slug: "tom-ford" }, concentration: "edp", images: ["/hero-perfume.png"], stock: 10, is_featured: true, is_active: true, created_at: new Date().toISOString() },
];

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
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-border shadow-sm">
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
      </div>

      <div className="flex flex-col px-1">
        <span className="text-[10px] tracking-widest text-charcoal-muted uppercase">{product.brand?.name}</span>
        <Link href={`/product/${product.slug}`} className="font-display text-lg text-charcoal hover:text-gold transition-colors line-clamp-1">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-body font-semibold text-gold text-sm">
            ${product.price.toLocaleString("es-CO")}
          </span>
          {product.compare_price && (
            <span className="font-body text-xs text-charcoal-muted line-through">
              ${product.compare_price.toLocaleString("es-CO")}
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
