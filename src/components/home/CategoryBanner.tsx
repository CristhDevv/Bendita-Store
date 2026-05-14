"use client";

import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Floral", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9z"/><path d="M12 4c-4.97 0-9 4.03-9 9 4.97 0 9-4.03 9-9z"/><path d="M12 4c4.97 0 9 4.03 9 9-4.97 0-9-4.03-9-9z"/></svg> },
  { name: "Amaderado", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M12 22v-8"/><path d="M12 14c-2.76 0-5-2.24-5-5 0-4.42 5-7 5-7s5 2.58 5 7c0 2.76-2.24 5-5 5z"/></svg> },
  { name: "Oriental", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { name: "Cítrico", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 12l7.07 7.07"/><path d="M12 12L4.93 4.93"/></svg> },
  { name: "Acuático", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
  { name: "Gourmand", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg> },
];

export function CategoryBanner() {
  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="font-display text-3xl md:text-4xl text-charcoal text-center mb-12">
          Explora por Familia
        </h2>
        
        {/* Mobile: Horizontal scroll | Desktop: 3 cols grid (md) / 6 cols (lg) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 pb-6 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.name}
              whileHover={{ scale: 1.05 }}
              className="snap-center shrink-0 w-[140px] md:w-auto flex flex-col items-center group cursor-pointer"
            >
              <div className="w-28 h-28 rounded-full flex items-center justify-center bg-white border border-gold/40 shadow-sm group-hover:shadow-[0_8px_20px_rgba(184,150,12,0.2)] transition-shadow duration-300 relative">
                <div className="text-gold z-10">
                  {cat.icon}
                </div>
              </div>
              <span className="mt-5 font-body text-sm font-medium text-charcoal-muted group-hover:text-gold transition-colors tracking-wide">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
