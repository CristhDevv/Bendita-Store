"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/format";

/* ─── Particle data generated once ──────────────────────────── */
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 5,
  dx: (Math.random() - 0.5) * 60,
  dy: (Math.random() - 0.5) * 60,
  opacity: Math.random() * 0.1 + 0.05,
}));

/* ─── Animation Variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.4 },
  },
};

/* ─── Stats data ─────────────────────────────────────────────── */
const STATS = [
  { icon: <Sparkles className="w-4 h-4" />, value: "500+", label: "Fragancias" },
  { icon: <Package className="w-4 h-4" />, value: "50+", label: "Marcas" },
  { icon: <Package className="w-4 h-4" />, value: "Estándar", label: "Envío Nacional" },
];

/* ═══════════════════════════════════════════════════════════════
   HeroSection
═══════════════════════════════════════════════════════════════ */
export function HeroSection({ discountProducts = [] }: { discountProducts?: Product[] }) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || discountProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % discountProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mounted, discountProducts.length]);

  const currentProduct = discountProducts[currentIndex] || null;
  const discountPercentage = currentProduct && currentProduct.compare_price && currentProduct.compare_price > currentProduct.price
    ? Math.round(((currentProduct.compare_price - currentProduct.price) / currentProduct.compare_price) * 100)
    : 0;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-cream">
      {/* ── Background ── */}
      <div
        className="absolute inset-0 -z-10"
      />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,162,39,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Animated golden particles ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, #D4AF37, #B8960C)`,
              boxShadow: `0 0 ${p.size * 2}px rgba(184,150,12,0.4)`,
            }}
            animate={{
              x: [0, p.dx, -p.dx * 0.5, 0],
              y: [0, p.dy, -p.dy * 0.5, 0],
              opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.3, p.opacity * 0.4],
              scale: [1, 1.4, 0.8, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ── LEFT: Copy ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-5"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 text-xs font-body tracking-[0.25em] uppercase text-charcoal-muted border border-border bg-white/50 rounded-full px-4 py-2">
                ✦ Nueva Colección 2026
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={itemVariants}
              className="font-display leading-tight"
            >
              <span className="block text-5xl md:text-6xl xl:text-7xl font-light text-charcoal">
                Descubre tu
              </span>
              <span
                className="block text-5xl md:text-6xl xl:text-7xl font-bold mt-1"
                style={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #B8960C 50%, #8A7009 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Esencia Única
              </span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              variants={itemVariants}
              className="font-body text-base md:text-lg text-charcoal-muted max-w-md leading-relaxed"
            >
              Perfumes de lujo que cuentan tu historia. Fragancias exclusivas para
              quienes buscan lo extraordinario.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-sm tracking-wide bg-charcoal text-white hover:bg-gold transition-all duration-300 shadow-lg shadow-gold/10"
                >
                  Explorar Catálogo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/products?sale=true"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-sm tracking-wide border border-charcoal/30 text-charcoal hover:border-gold hover:text-gold transition-all duration-300"
                >
                  Ver Ofertas
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-6 pt-2"
            >
              {STATS.map((stat, idx) => (
                <div key={stat.label} className="flex items-center gap-6">
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="flex items-center gap-1 text-gold text-[10px] mb-1">
                      {stat.icon}
                    </span>
                    <span className="font-display font-semibold text-xl text-charcoal leading-none">
                      {stat.value}
                    </span>
                    <span className="font-body text-[11px] text-charcoal-muted tracking-wide uppercase mt-0.5">
                      {stat.label}
                    </span>
                  </div>
                  {idx < STATS.length - 1 && (
                    <div className="h-10 w-px bg-border" />
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Image Carousel ── */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center lg:items-end justify-center w-full"
          >
            {/* Glow behind image */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-10 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 50% 50%, #B8960C, transparent)",
              }}
            />

            {/* Carousel Content */}
            <div className="flex flex-col items-center space-y-5 w-full max-w-[380px] lg:max-w-[420px]">
              {/* Image frame */}
              <div
                className="relative rounded-3xl overflow-hidden border border-border w-full aspect-[3/4] bg-white/50 backdrop-blur-[4px] shadow-xl group cursor-pointer"
              >
                {currentProduct && (
                  <Link href={`/product/${currentProduct.slug}`} className="block w-full h-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <Image
                          src={currentProduct.images?.[0] || "/hero-perfume.png"}
                          alt={currentProduct.name}
                          fill
                          priority
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 80vw, 340px"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </Link>
                )}

                {/* Inner gradient overlay (bottom) */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none z-10"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(250,249,247,0.8) 0%, transparent 100%)",
                  }}
                />

                {/* ── Floating badge "% de descuento" ── */}
                {discountPercentage > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={`badge-${currentIndex}`}
                    className="absolute top-4 left-4 z-20 bg-gold text-white font-body font-bold text-[10px] px-2.5 py-1 rounded-full shadow-lg"
                  >
                    -{discountPercentage}% OFF
                  </motion.div>
                )}

                {/* ── Floating badge "Top Seller" ── */}
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 md:top-6 md:-right-6 z-20"
                >
                  <div
                    className="relative px-4 py-3 rounded-2xl shadow-xl border border-border bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <div>
                        <p className="font-body font-semibold text-xs text-gold tracking-wide uppercase">
                          Top Seller
                        </p>
                        <p className="font-body text-[10px] text-charcoal-muted">
                          Esta semana
                        </p>
                      </div>
                    </div>
                    {/* Pulsing dot */}
                    <span className="absolute top-2 right-2 w-2 h-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Product Info below the frame */}
              {currentProduct && (
                <Link
                  href={`/product/${currentProduct.slug}`}
                  className="w-full text-center space-y-1 block group/info"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-0.5"
                    >
                      {currentProduct.brand?.name && (
                        <p className="text-[11px] font-body tracking-[0.2em] uppercase text-gold font-semibold">
                          {currentProduct.brand.name}
                        </p>
                      )}
                      <h3 className="font-display font-medium text-lg text-charcoal group-hover/info:text-gold transition-colors line-clamp-1">
                        {currentProduct.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        {currentProduct.compare_price && (
                          <span className="font-body text-xs text-charcoal-muted line-through">
                            ${formatPrice(currentProduct.compare_price)}
                          </span>
                        )}
                        <span className="font-body text-sm font-bold text-charcoal">
                          ${formatPrice(currentProduct.price)}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </Link>
              )}

              {/* Dots navigation */}
              {discountProducts.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {discountProducts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? "bg-gold w-6"
                          : "bg-charcoal/20 hover:bg-charcoal/40 w-2"
                      }`}
                      aria-label={`Ir a slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-body text-[10px] tracking-[0.2em] uppercase text-charcoal-muted">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-gold/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
