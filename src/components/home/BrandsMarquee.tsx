"use client";

import { motion } from "framer-motion";

/* ─── Brand list (logos via text for now) ─── */
const BRANDS = [
  { name: "Dior", country: "Francia" },
  { name: "Chanel", country: "Francia" },
  { name: "Tom Ford", country: "USA" },
  { name: "Creed", country: "Reino Unido" },
  { name: "Armani", country: "Italia" },
  { name: "Versace", country: "Italia" },
  { name: "Guerlain", country: "Francia" },
  { name: "YSL", country: "Francia" },
  { name: "Paco Rabanne", country: "España" },
  { name: "Givenchy", country: "Francia" },
];

/* Duplicamos para loop infinito */
const DOUBLED = [...BRANDS, ...BRANDS];

function BrandPill({ name, country }: { name: string; country: string }) {
  return (
    <div className="flex-shrink-0 px-8 py-4 rounded-2xl bg-white border border-border hover:border-gold transition-colors cursor-pointer group shadow-sm">
      <p className="font-display font-semibold text-xl text-charcoal-muted group-hover:text-gold transition-colors whitespace-nowrap">
        {name}
      </p>
      <p className="font-body text-[10px] text-charcoal-muted/50 tracking-widest uppercase mt-0.5 whitespace-nowrap">
        {country}
      </p>
    </div>
  );
}

export function BrandsMarquee() {
  return (
    <section className="py-20 bg-cream border-y border-border overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 mb-12">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-body text-xs tracking-[0.25em] uppercase text-gold-400 text-center"
        >
          ✦ Marcas exclusivas
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl md:text-4xl text-center text-charcoal font-light mt-3"
        >
          Las mejores{" "}
          <span
            className="font-bold"
            style={{
              background: "linear-gradient(135deg,#f5d97e,#c9a227)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            casas de perfumería
          </span>
        </motion.h2>
      </div>

      {/* Marquee track 1 — left */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-cream), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-cream), transparent)" }} />

        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {DOUBLED.map((b, i) => (
            <BrandPill key={`${b.name}-${i}`} name={b.name} country={b.country} />
          ))}
        </motion.div>
      </div>

      {/* Marquee track 2 — right (reverse) */}
      <div className="relative mt-4">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-cream), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-cream), transparent)" }} />

        <motion.div
          className="flex gap-4"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {DOUBLED.map((b, i) => (
            <BrandPill key={`rev-${b.name}-${i}`} name={b.name} country={b.country} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
