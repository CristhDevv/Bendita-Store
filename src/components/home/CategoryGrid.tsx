"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    slug: "mujeres",
    label: "Para Ella",
    sub: "Feminidad en cada nota",
    emoji: "🌸",
    color: "from-rose-100/60 to-black/80",
    accentColor: "#f5d97e",
    size: "large",
  },
  {
    slug: "hombres",
    label: "Para Él",
    sub: "Poder y distinción",
    emoji: "🌿",
    color: "from-teal-100/60 to-black/80",
    accentColor: "#c9a227",
    size: "small",
  },
  {
    slug: "unisex",
    label: "Unisex",
    sub: "Sin fronteras",
    emoji: "✨",
    color: "from-purple-100/60 to-black/80",
    accentColor: "#e8c14a",
    size: "small",
  },
  {
    slug: "niche",
    label: "Nicho",
    sub: "Rareza y exclusividad",
    emoji: "💎",
    color: "from-amber-100/60 to-black/80",
    accentColor: "#f5d97e",
    size: "large",
  },
];

export function CategoryGrid() {
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.25em] uppercase text-gold-400 mb-3">
            ✦ Encuentra la tuya
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-charcoal">
            Explora por{" "}
            <span
              className="font-bold"
              style={{
                background: "linear-gradient(135deg,#f5d97e,#c9a227)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Categoría
            </span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-5 h-[460px] md:h-[540px]">
          {CATEGORIES.map((cat, i) => {
            const isLargeFirst = i === 0;
            const isLargeLast = i === 3;

            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={`relative group overflow-hidden rounded-3xl border border-border shadow-sm cursor-pointer
                  ${isLargeFirst ? "col-span-1 md:col-span-2 row-span-2" : ""}
                  ${isLargeLast ? "col-span-1 md:col-span-2 row-span-1" : ""}
                  ${!isLargeFirst && !isLargeLast ? "col-span-1 row-span-1" : ""}
                `}
              >
                {/* Background image */}
                <Image
                  src="/hero-perfume.png"
                  alt={cat.label}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} transition-opacity duration-300 group-hover:opacity-90`} />

                {/* Border glow on hover */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${cat.accentColor}40` }}
                />

                {/* Content */}
                <Link href={`/products?category=${cat.slug}`} className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
                  <span className="text-3xl mb-2">{cat.emoji}</span>
                  <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                    {cat.label}
                  </h3>
                  <p className="font-body text-xs text-white/80 mt-1 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {cat.sub}
                  </p>
                  <div
                    className="h-0.5 w-8 mt-3 rounded-full opacity-0 group-hover:opacity-100 group-hover:w-16 transition-all duration-500"
                    style={{ background: cat.accentColor }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
