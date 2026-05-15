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

  return (
    <div className="flex flex-col gap-7 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold" />
          <span className="font-display text-lg font-semibold text-charcoal">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="font-body text-xs text-gold hover:text-gold-400 transition-colors">
            Limpiar todo
          </button>
        )}
      </div>

      {/* Género */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-charcoal-muted mb-3">Género</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map(g => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`px-4 py-2 rounded-full text-xs font-body transition-all ${
                filters.gender === g.value
                  ? "bg-charcoal text-white font-semibold"
                  : "border border-border text-charcoal-muted hover:border-charcoal"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Concentración */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-charcoal-muted mb-3">Concentración</p>
        <div className="flex flex-col gap-2.5">
          {CONCENTRATIONS.map(c => (
            <label key={c.value} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                filters.concentrations.includes(c.value)
                  ? "bg-gold border-gold"
                  : "border-border group-hover:border-charcoal"
              }`}>
                {filters.concentrations.includes(c.value) && (
                  <svg viewBox="0 0 12 9" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={filters.concentrations.includes(c.value)} onChange={() => toggleConcentration(c.value)} />
              <span className="font-body text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-charcoal-muted mb-3">Precio (COP)</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="font-body text-[10px] text-charcoal-muted mb-1 block">Mínimo</label>
            <input
              type="number"
              min={0}
              step={10000}
              value={filters.priceMin === 0 ? "" : filters.priceMin}
              onChange={e => setPriceRange([Number(e.target.value) || 0, filters.priceMax])}
              placeholder="$ 0"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors"
            />
          </div>
          <span className="text-charcoal-muted font-body text-sm mt-4">—</span>
          <div className="flex-1">
            <label className="font-body text-[10px] text-charcoal-muted mb-1 block">Máximo</label>
            <input
              type="number"
              min={0}
              step={10000}
              value={filters.priceMax === 0 ? "" : filters.priceMax}
              onChange={e => setPriceRange([filters.priceMin, Number(e.target.value) || 0])}
              placeholder="Sin límite"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Marcas */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-charcoal-muted mb-3">Marcas</p>
        <div className="flex flex-col gap-2.5">
          {visibleBrands.map(b => (
            <label key={b} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                filters.brands.includes(b) ? "bg-gold border-gold" : "border-border group-hover:border-charcoal"
              }`}>
                {filters.brands.includes(b) && (
                  <svg viewBox="0 0 12 9" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} />
              <span className="font-body text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">{b}</span>
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
        <p className="font-body text-xs tracking-widest uppercase text-charcoal-muted mb-3">Notas Olfativas</p>
        <div className="flex flex-wrap gap-2">
          {NOTES.map(n => (
            <button
              key={n}
              onClick={() => toggleNote(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                filters.notes.includes(n)
                  ? "bg-charcoal text-white font-semibold"
                  : "border border-border text-charcoal-muted hover:border-charcoal"
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
        <div className="sticky top-28 rounded-2xl border border-border bg-white overflow-y-auto max-h-[calc(100vh-8rem)]">
          <FilterContent {...props} isMobile={false} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {props.isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={props.onClose}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto lg:hidden border-t border-border"
            >
              {/* Handle bar */}
              <div className="sticky top-0 bg-white pt-4 pb-3 flex flex-col items-center gap-3 border-b border-border z-10">
                <div className="w-12 h-1 rounded-full bg-border" />
                <div className="flex items-center justify-between w-full px-6">
                  <span className="font-display text-lg text-charcoal">Filtros</span>
                  <button onClick={props.onClose} className="text-charcoal-muted hover:text-charcoal transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <FilterContent {...props} isMobile={true} />

              {/* Sticky apply button */}
              <div className="sticky bottom-0 px-6 py-4 bg-white/95 backdrop-blur-xl border-t border-border">
                <button
                  onClick={props.onClose}
                  className="w-full py-4 rounded-2xl font-body font-semibold bg-charcoal text-white hover:bg-gold transition-colors text-sm"
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
