"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useFilters, type Concentration } from "@/hooks/useFilters";
import type { Product } from "@/types";

const PAGE_SIZE = 9;

const ALL_PRODUCTS: Product[] = [
  { id: "1",  name: "Oud Royal Noir",       slug: "oud-royal-noir",      price: 320000, compare_price: 420000, brand: { id: "b1", name: "Dior",    slug: "dior"   }, concentration: "edp",    gender: "unisex", images: ["/hero-perfume.png"], notes_top: ["Bergamota"], notes_heart: ["Oud"], notes_base: ["Sándalo"], stock: 12, is_featured: true, is_active: true, created_at: "2025-01-01" },
  { id: "2",  name: "Jasmine Lumière",       slug: "jasmine-lumiere",     price: 280000,                        brand: { id: "b2", name: "Chanel", slug: "chanel" }, concentration: "parfum",  gender: "women",  images: ["/hero-perfume.png"], notes_top: ["Bergamota"], notes_heart: ["Jazmín"], notes_base: ["Musk"], stock: 8,  is_featured: true, is_active: true, created_at: "2025-01-02" },
  { id: "3",  name: "Cedar & Vetiver",       slug: "cedar-vetiver",       price: 195000, compare_price: 250000, brand: { id: "b3", name: "Tom Ford", slug: "tom-ford" }, concentration: "edt", gender: "men",    images: ["/hero-perfume.png"], notes_top: ["Limón"],     notes_heart: ["Cedro"], notes_base: ["Sándalo"], stock: 20, is_featured: true, is_active: true, created_at: "2025-01-03" },
  { id: "4",  name: "Rose Céleste",          slug: "rose-celeste",        price: 345000,                        brand: { id: "b4", name: "Creed",    slug: "creed"  }, concentration: "parfum",  gender: "women",  images: ["/hero-perfume.png"], notes_top: ["Pera"],      notes_heart: ["Rosa"], notes_base: ["Musk"], stock: 5,  is_featured: true, is_active: true, created_at: "2025-01-04" },
  { id: "5",  name: "Santal 33",             slug: "santal-33",           price: 410000,                        brand: { id: "b5", name: "Le Labo",  slug: "le-labo" }, concentration: "edp",    gender: "unisex", images: ["/hero-perfume.png"], notes_top: ["Cedro"],     notes_heart: ["Sándalo"], notes_base: ["Vainilla"], stock: 15, is_featured: true, is_active: true, created_at: "2025-01-05" },
  { id: "6",  name: "Aqua Universalis",      slug: "aqua-universalis",    price: 215000, compare_price: 260000, brand: { id: "b6", name: "MFK",      slug: "mfk"    }, concentration: "edt",    gender: "unisex", images: ["/hero-perfume.png"], notes_top: ["Bergamota"], notes_heart: ["Musk"], notes_base: ["Cedro"], stock: 25, is_featured: true, is_active: true, created_at: "2025-01-06" },
  { id: "7",  name: "Baccarat Rouge 540",    slug: "baccarat-rouge",      price: 580000,                        brand: { id: "b6", name: "MFK",      slug: "mfk"    }, concentration: "edp",    gender: "unisex", images: ["/hero-perfume.png"], notes_top: ["Jazmín"],   notes_heart: ["Sándalo"], notes_base: ["Oud"], stock: 4,  is_featured: true, is_active: true, created_at: "2025-01-07" },
  { id: "8",  name: "Tobacco Vanille",       slug: "tobacco-vanille",     price: 390000, compare_price: 450000, brand: { id: "b3", name: "Tom Ford", slug: "tom-ford" }, concentration: "edp", gender: "unisex", images: ["/hero-perfume.png"], notes_top: ["Tabaco"],   notes_heart: ["Vainilla"], notes_base: ["Musk"], stock: 10, is_featured: true, is_active: true, created_at: "2025-01-08" },
  { id: "9",  name: "Chance Eau Tendre",     slug: "chance-eau-tendre",   price: 235000,                        brand: { id: "b2", name: "Chanel", slug: "chanel" }, concentration: "edt",    gender: "women",  images: ["/hero-perfume.png"], notes_top: ["Pomelo"],   notes_heart: ["Jazmín"], notes_base: ["Cedro"], stock: 18, is_featured: false, is_active: true, created_at: "2025-01-09" },
  { id: "10", name: "Bleu de Chanel",        slug: "bleu-de-chanel",      price: 280000, compare_price: 320000, brand: { id: "b2", name: "Chanel", slug: "chanel" }, concentration: "edp",    gender: "men",    images: ["/hero-perfume.png"], notes_top: ["Limón"],    notes_heart: ["Cedro"], notes_base: ["Sándalo"], stock: 22, is_featured: true, is_active: true, created_at: "2025-01-10" },
  { id: "11", name: "Black Opium",           slug: "black-opium",         price: 265000,                        brand: { id: "b7", name: "YSL",     slug: "ysl"    }, concentration: "edp",    gender: "women",  images: ["/hero-perfume.png"], notes_top: ["Pera"],     notes_heart: ["Rosa"], notes_base: ["Vainilla"], stock: 14, is_featured: true, is_active: true, created_at: "2025-01-11" },
  { id: "12", name: "Dylan Blue",            slug: "dylan-blue",          price: 175000, compare_price: 210000, brand: { id: "b8", name: "Versace", slug: "versace" }, concentration: "edt",   gender: "men",    images: ["/hero-perfume.png"], notes_top: ["Bergamota"], notes_heart: ["Cedro"], notes_base: ["Oud"], stock: 30, is_featured: false, is_active: true, created_at: "2025-01-12" },
];

export default function ProductsPage() {
  const {
    filters, setGender, toggleConcentration, setPriceRange,
    toggleBrand, toggleNote, setSortBy, setViewMode, clearFilters, hasActiveFilters,
  } = useFilters();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = ALL_PRODUCTS.filter(p => {
      if (filters.gender !== "all" && p.gender !== filters.gender) return false;
      if (filters.concentrations.length > 0 && p.concentration && !filters.concentrations.includes(p.concentration as Concentration)) return false;
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      if (filters.brands.length > 0 && p.brand && !filters.brands.includes(p.brand.name)) return false;
      if (filters.notes.length > 0) {
        const allNotes = [...(p.notes_top ?? []), ...(p.notes_heart ?? []), ...(p.notes_base ?? [])];
        if (!filters.notes.some(n => allNotes.includes(n))) return false;
      }
      return true;
    });

    if (filters.sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (filters.sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (filters.sortBy === "newest") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));

    return list;
  }, [filters]);

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
        <p className="font-body text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-2">✦ Colección completa</p>
        <h1 className="font-display text-4xl md:text-5xl text-charcoal">
          Catálogo de{" "}
          <span className="font-bold text-gold">
            Fragancias
          </span>
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
