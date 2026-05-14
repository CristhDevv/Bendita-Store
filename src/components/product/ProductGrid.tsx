"use client";

import { LayoutGrid, LayoutList, ChevronDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";
import type { SortBy } from "@/hooks/useFilters";

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "Relevancia", value: "relevance" },
  { label: "Precio: menor a mayor", value: "price_asc" },
  { label: "Precio: mayor a menor", value: "price_desc" },
  { label: "Más nuevos", value: "newest" },
  { label: "Más vendidos", value: "bestselling" },
];

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[3/4] rounded-2xl bg-border" />
      <div className="px-1 flex flex-col gap-2">
        <div className="h-2 w-16 rounded bg-border" />
        <div className="h-4 w-32 rounded bg-border" />
        <div className="h-3 w-20 rounded bg-border" />
      </div>
      <div className="h-10 rounded-xl bg-border" />
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 gap-6">
      <svg viewBox="0 0 120 120" className="w-28 h-28 text-border" fill="none">
        <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
        <path d="M40 55c0-11 9-20 20-20s20 9 20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="48" cy="70" r="3" fill="currentColor" opacity="0.4"/>
        <circle cx="72" cy="70" r="3" fill="currentColor" opacity="0.4"/>
        <path d="M48 84c3.3-3 20.7-3 24 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <div className="text-center">
        <p className="font-display text-2xl text-charcoal-muted">Sin resultados</p>
        <p className="font-body text-sm text-charcoal-muted mt-2">No encontramos fragancias con estos filtros</p>
      </div>
      <button
        onClick={onClear}
        className="px-6 py-3 rounded-xl border border-border bg-cream text-charcoal text-sm font-body hover:bg-border transition-colors shadow-sm"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

interface Props {
  products: Product[];
  total: number;
  loading: boolean;
  sortBy: SortBy;
  viewMode: "grid" | "list";
  onSortChange: (s: SortBy) => void;
  onViewModeChange: (v: "grid" | "list") => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onClearFilters: () => void;
}

export function ProductGrid({
  products, total, loading, sortBy, viewMode,
  onSortChange, onViewModeChange, onLoadMore, hasMore, onClearFilters,
}: Props) {
  return (
    <div className="flex-1 min-w-0">
      {/* Grid header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <p className="font-body text-sm text-charcoal-muted">
          <span className="text-charcoal font-medium">{total}</span> productos encontrados
        </p>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortBy)}
              className="appearance-none bg-white border border-border text-charcoal text-sm rounded-xl px-4 py-2.5 pr-8 font-body cursor-pointer focus:outline-none focus:border-gold shadow-sm"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted pointer-events-none" />
          </div>
          {/* View toggle */}
          <div className="flex items-center border border-border bg-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-cream text-charcoal" : "text-charcoal-muted hover:text-charcoal"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-cream text-charcoal" : "text-charcoal-muted hover:text-charcoal"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="grid">
          <EmptyState onClear={onClearFilters} />
        </div>
      ) : (
        <>
          <motion.div
            className={viewMode === "grid"
              ? "grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8"
              : "flex flex-col gap-5"}
            layout
          >
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4) }}
                layout
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-14">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl border border-border bg-white text-charcoal font-body text-sm hover:border-gold transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Cargar más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
