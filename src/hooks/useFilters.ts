"use client";
import { useState, useCallback } from "react";

export type Gender = "all" | "women" | "men" | "unisex";
export type Concentration = "parfum" | "edp" | "edt" | "edc";
export type SortBy = "relevance" | "price_asc" | "price_desc" | "newest" | "bestselling";

export interface FilterState {
  gender: Gender;
  concentrations: Concentration[];
  priceMin: number;
  priceMax: number;
  brands: string[];
  notes: string[];
  sortBy: SortBy;
  viewMode: "grid" | "list";
}

const DEFAULT: FilterState = {
  gender: "all", concentrations: [], priceMin: 0, priceMax: 999999999,
  brands: [], notes: [], sortBy: "relevance", viewMode: "grid",
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT);

  const setGender = useCallback((gender: Gender) =>
    setFilters(f => ({ ...f, gender })), []);

  const toggleConcentration = useCallback((c: Concentration) =>
    setFilters(f => ({
      ...f,
      concentrations: f.concentrations.includes(c)
        ? f.concentrations.filter(x => x !== c)
        : [...f.concentrations, c],
    })), []);

  const setPriceRange = useCallback((range: [number, number]) =>
    setFilters(f => ({ ...f, priceMin: range[0], priceMax: range[1] })), []);

  const toggleBrand = useCallback((b: string) =>
    setFilters(f => ({
      ...f,
      brands: f.brands.includes(b) ? f.brands.filter(x => x !== b) : [...f.brands, b],
    })), []);

  const toggleNote = useCallback((n: string) =>
    setFilters(f => ({
      ...f,
      notes: f.notes.includes(n) ? f.notes.filter(x => x !== n) : [...f.notes, n],
    })), []);

  const setSortBy = useCallback((sortBy: SortBy) =>
    setFilters(f => ({ ...f, sortBy })), []);

  const setViewMode = useCallback((viewMode: "grid" | "list") =>
    setFilters(f => ({ ...f, viewMode })), []);

  const clearFilters = useCallback(() => setFilters(DEFAULT), []);

  const hasActiveFilters =
    filters.gender !== "all" || filters.concentrations.length > 0 ||
    filters.priceMin > 0 || filters.priceMax < 999999999 ||
    filters.brands.length > 0 || filters.notes.length > 0;

  return {
    filters, setGender, toggleConcentration, setPriceRange,
    toggleBrand, toggleNote, setSortBy, setViewMode, clearFilters, hasActiveFilters,
  };
}
