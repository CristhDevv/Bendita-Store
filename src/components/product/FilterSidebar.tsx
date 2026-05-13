"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import type { FilterState, Gender, Concentration } from "@/hooks/useFilters";

const BRANDS = ["Dior", "Chanel", "Tom Ford", "Creed", "Armani", "Versace", "Guerlain", "YSL", "Le Labo", "MFK"];
const NOTES = ["Rosa", "Vainilla", "Sándalo", "Bergamota", "Oud", "Musk", "Jazmín", "Cedro"];
const GENDERS: { label: string; value: Gender }[] = [
  { label: "Todos", value: "all" },
  { label: "Mujer", value: "women" },
  { label: "Hombre", value: "men" },
  { label: "Unisex", value: "unisex" },
];
const CONCENTRATIONS: { label: string; value: Concentration }[] = [
  { label: "Parfum", value: "parfum" },
  { label: "EDP", value: "edp" },
  { label: "EDT", value: "edt" },
  { label: "EDC", value: "edc" },
];
const MIN_PRICE = 0;
const MAX_PRICE = 1000000;

interface Props {
  filters: FilterState;
  setGender: (g: Gender) => void;
  toggleConcentration: (c: Concentration) => void;
  setPriceRange: (r: [number, number]) => void;
  toggleBrand: (b: string) => void;
  toggleNote: (n: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
}

function FilterContent({ filters, setGender, toggleConcentration, setPriceRange, toggleBrand, toggleNote, clearFilters, hasActiveFilters, onClose, isMobile }: Props & { isMobile?: boolean }) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const visibleBrands = showAllBrands ? BRANDS : BRANDS.slice(0, 6);
  const leftPct = ((filters.priceMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const rightPct = 100 - ((filters.priceMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="flex flex-col gap-7 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold" />
          <span className="font-display text-lg font-semibold text-crystal">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="font-body text-xs text-gold hover:text-gold-400 transition-colors">
            Limpiar todo
          </button>
        )}
      </div>

      {/* Género */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-crystal/50 mb-3">Género</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map(g => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`px-4 py-2 rounded-full text-xs font-body transition-all ${
                filters.gender === g.value
                  ? "bg-gold text-navy-950 font-semibold"
                  : "border border-gold-500/30 text-crystal/70 hover:border-gold-500/60"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Concentración */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-crystal/50 mb-3">Concentración</p>
        <div className="flex flex-col gap-2.5">
          {CONCENTRATIONS.map(c => (
            <label key={c.value} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                filters.concentrations.includes(c.value)
                  ? "bg-gold border-gold"
                  : "border-white/20 group-hover:border-gold-500/50"
              }`}>
                {filters.concentrations.includes(c.value) && (
                  <svg viewBox="0 0 12 9" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4L4.5 7.5L11 1" stroke="#04091f" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={filters.concentrations.includes(c.value)} onChange={() => toggleConcentration(c.value)} />
              <span className="font-body text-sm text-crystal/80 group-hover:text-crystal transition-colors">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-crystal/50 mb-1">Precio</p>
        <p className="font-body text-xs text-gold mb-4">
          COP ${filters.priceMin.toLocaleString("es-CO")} – COP ${filters.priceMax.toLocaleString("es-CO")}
        </p>
        <div className="relative h-5 flex items-center">
          <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full" />
          <div
            className="absolute h-1 bg-gold rounded-full pointer-events-none"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />
          <input
            type="range" min={MIN_PRICE} max={MAX_PRICE} step={10000}
            value={filters.priceMin}
            onChange={e => setPriceRange([Math.min(Number(e.target.value), filters.priceMax - 50000), filters.priceMax])}
            className="absolute w-full h-full opacity-0 cursor-pointer"
            style={{ zIndex: leftPct > 90 ? 5 : 3 }}
          />
          <input
            type="range" min={MIN_PRICE} max={MAX_PRICE} step={10000}
            value={filters.priceMax}
            onChange={e => setPriceRange([filters.priceMin, Math.max(Number(e.target.value), filters.priceMin + 50000)])}
            className="absolute w-full h-full opacity-0 cursor-pointer"
            style={{ zIndex: 4 }}
          />
          <div className="absolute w-4 h-4 rounded-full bg-gold shadow-md pointer-events-none" style={{ left: `calc(${leftPct}% - 8px)` }} />
          <div className="absolute w-4 h-4 rounded-full bg-gold shadow-md pointer-events-none" style={{ left: `calc(${100 - rightPct}% - 8px)` }} />
        </div>
      </div>

      {/* Marcas */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-crystal/50 mb-3">Marcas</p>
        <div className="flex flex-col gap-2.5">
          {visibleBrands.map(b => (
            <label key={b} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                filters.brands.includes(b) ? "bg-gold border-gold" : "border-white/20 group-hover:border-gold-500/50"
              }`}>
                {filters.brands.includes(b) && (
                  <svg viewBox="0 0 12 9" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4L4.5 7.5L11 1" stroke="#04091f" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} />
              <span className="font-body text-sm text-crystal/80 group-hover:text-crystal transition-colors">{b}</span>
            </label>
          ))}
        </div>
        {BRANDS.length > 6 && (
          <button onClick={() => setShowAllBrands(s => !s)} className="mt-3 font-body text-xs text-gold hover:text-gold-400 transition-colors">
            {showAllBrands ? "Ver menos" : `Ver más (${BRANDS.length - 6} más)`}
          </button>
        )}
      </div>

      {/* Notas */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-crystal/50 mb-3">Notas Olfativas</p>
        <div className="flex flex-wrap gap-2">
          {NOTES.map(n => (
            <button
              key={n}
              onClick={() => toggleNote(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                filters.notes.includes(n)
                  ? "bg-gold text-navy-950 font-semibold"
                  : "border border-gold-500/30 text-crystal/70 hover:border-gold-500/60"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Apply button space */}
      {isMobile && <div className="h-20" />}
    </div>
  );
}

export function FilterSidebar(props: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-28 rounded-2xl border border-white/5 bg-navy-900 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <FilterContent {...props} isMobile={false} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {props.isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={props.onClose}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-navy-950 rounded-t-3xl max-h-[85vh] overflow-y-auto lg:hidden border-t border-white/5"
            >
              {/* Handle bar */}
              <div className="sticky top-0 bg-navy-950 pt-4 pb-3 flex flex-col items-center gap-3 border-b border-white/5 z-10">
                <div className="w-12 h-1 rounded-full bg-white/20" />
                <div className="flex items-center justify-between w-full px-6">
                  <span className="font-display text-lg text-crystal">Filtros</span>
                  <button onClick={props.onClose} className="text-crystal/50 hover:text-crystal transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <FilterContent {...props} isMobile={true} />

              {/* Sticky apply button */}
              <div className="sticky bottom-0 px-6 py-4 bg-navy-950/95 backdrop-blur-xl border-t border-white/5">
                <button
                  onClick={props.onClose}
                  className="w-full py-4 rounded-2xl font-body font-semibold text-navy-950 text-sm"
                  style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
                >
                  Aplicar filtros
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
