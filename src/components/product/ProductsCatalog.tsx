"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useFilters, type Concentration } from "@/hooks/useFilters";
import type { Product } from "@/types";

const PAGE_SIZE = 9;

interface ProductsCatalogProps {
  initialProducts: Product[];
}

export function ProductsCatalog({ initialProducts }: ProductsCatalogProps) {
  const {
    filters, setGender, toggleConcentration, setPriceRange,
    toggleBrand, toggleNote, setSortBy, setViewMode, clearFilters, hasActiveFilters,
  } = useFilters();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const familyFilter = searchParams.get("family");

  const handleRemoveFamily = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("family");
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    let list = initialProducts.filter(p => {
      if (filters.gender !== "all" && p.gender !== filters.gender) return false;
      if (
        filters.concentrations.length > 0 &&
        p.concentration &&
        !filters.concentrations.includes(p.concentration as Concentration)
      ) return false;
      if (p.price < filters.priceMin) return false;
      if (filters.priceMax < 999999999 && p.price > filters.priceMax) return false;
      if (filters.brands.length > 0 && p.brand && !filters.brands.includes(p.brand.name)) return false;
      if (familyFilter && (!p.olfactive_family || !p.olfactive_family.includes(familyFilter))) return false;
      return true;
    });

    if (filters.sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (filters.sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (filters.sortBy === "newest") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));

    return list;
  }, [filters, initialProducts, familyFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const sidebarProps = {
    filters, setGender, toggleConcentration, setPriceRange,
    toggleBrand, toggleNote, clearFilters, hasActiveFilters,
    isMobileOpen: drawerOpen, onClose: () => setDrawerOpen(false),
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <p className="font-body text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-2">
          ✦ Colección completa
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-charcoal">
          Catálogo de{" "}
          <span className="font-bold text-gold">Fragancias</span>
        </h1>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-cream text-charcoal text-sm font-body hover:border-gold hover:text-gold transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-gold ml-1" />}
        </button>
      </div>

      {familyFilter && (
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-gold text-charcoal rounded-full text-sm font-body">
            Familia: {familyFilter}
            <button onClick={handleRemoveFamily} className="hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Layout */}
      <div className="flex gap-10 items-start">
        <FilterSidebar {...sidebarProps} />
        <ProductGrid
          products={paginated}
          total={filtered.length}
          loading={false}
          sortBy={filters.sortBy}
          viewMode={filters.viewMode}
          onSortChange={s => { setSortBy(s); setPage(1); }}
          onViewModeChange={setViewMode}
          onLoadMore={() => setPage(p => p + 1)}
          hasMore={hasMore}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}
