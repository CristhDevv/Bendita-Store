"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Package } from "lucide-react";

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

// Badge bounce uses direct animate prop (not Variants) to avoid keyframe typing issues

/* ─── Stats data ─────────────────────────────────────────────── */
const STATS = [
  { icon: <Sparkles className="w-4 h-4" />, value: "500+", label: "Fragancias" },
  { icon: <Package className="w-4 h-4" />, value: "50+", label: "Marcas" },
  { icon: <Zap className="w-4 h-4" />, value: "Express", label: "Envío" },
];

/* ═══════════════════════════════════════════════════════════════
   HeroSection
═══════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="container mx-auto px-4 md:px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── LEFT: Copy ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 text-xs font-body tracking-[0.25em] uppercase text-charcoal-muted border border-border bg-white/50 rounded-full px-4 py-2">
                ✦ Nueva Colección 2025
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
                  Explorar Colección
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
              className="flex items-center gap-6 pt-4"
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

          {/* ── RIGHT: Image ── */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative flex justify-center lg:justify-end"
          >
            {/* Glow behind image */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-10 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 50% 50%, #B8960C, transparent)",
              }}
            />

            {/* Image frame */}
            <div
              className="relative rounded-3xl overflow-hidden border border-border"
              style={{
                aspectRatio: "3/4",
                width: "min(340px, 80vw)",
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)",
                backdropFilter: "blur(4px)",
              }}
            >
              <Image
                src="/hero-perfume.png"
                alt="Fragancia premium — Bendita Store"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 80vw, 340px"
              />

              {/* Inner gradient overlay (bottom) */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(250,249,247,0.8) 0%, transparent 100%)",
                }}
              />
            </div>

            {/* ── Floating badge "Top Seller" ── */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 md:top-6 md:-right-6 z-10"
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

            {/* ── Floating notes badge (left side) ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute bottom-12 -left-4 md:-left-8 z-10"
            >
              <div
                className="px-4 py-3 rounded-2xl border border-border shadow-xl bg-white"
              >
                <p className="font-body text-[10px] text-gold tracking-widest uppercase mb-2">
                  Notas
                </p>
                <div className="flex flex-col gap-1">
                  {["🌸 Rosa & Jazmín", "🌿 Sándalo", "🍋 Cítrico fresco"].map(
                    (note) => (
                      <p key={note} className="font-body text-[11px] text-charcoal-muted">
                        {note}
                      </p>
                    )
                  )}
                </div>
              </div>
            </motion.div>

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
