"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearch(""); // Resetear búsqueda al abrir
          }
        }}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-xl bg-cream border flex items-center justify-between font-body text-sm transition-colors text-left
          ${disabled ? "opacity-50 cursor-not-allowed border-border" : "border-border hover:border-gold/50 cursor-pointer"}
          ${isOpen ? "border-gold" : ""}
        `}
      >
        <span className={`truncate mr-2 ${selectedOption ? "text-charcoal" : "text-charcoal-muted/60"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-charcoal-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white border border-border shadow-xl rounded-xl overflow-hidden flex flex-col"
          >
            {/* Buscador interno */}
            <div className="p-2 border-b border-border bg-cream/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-muted" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar opción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white border border-border text-sm font-body text-charcoal outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>
            
            {/* Lista de Opciones */}
            <div className="max-h-[200px] overflow-y-auto p-1 font-body text-sm">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      value === opt.value ? "bg-gold/10 text-gold font-medium" : "text-charcoal hover:bg-cream"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {value === opt.value && <Check className="w-4 h-4 text-gold shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-charcoal-muted text-xs">
                  Sin resultados
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
