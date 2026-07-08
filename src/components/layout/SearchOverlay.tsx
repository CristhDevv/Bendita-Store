import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import { useTracking } from "@/hooks/useTracking";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  brands?: {
    name: string;
  };
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { trackEvent } = useTracking();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setDebouncedQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function searchProducts() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, images, price, brands(name)")
          .ilike("name", `%${debouncedQuery}%`)
          .eq("is_active", true)
          .limit(6);

        if (error) throw error;
        setResults(data as unknown as ProductResult[]);
        // Track search event after results are known
        if (debouncedQuery.trim()) {
          trackEvent("search", {
            search_term: debouncedQuery.trim(),
            result_count: (data ?? []).length,
            has_results: (data ?? []).length > 0,
          });
        }
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setIsLoading(false);
      }
    }

    searchProducts();
  }, [debouncedQuery, supabase, trackEvent]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header / Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border relative">
              <Search className="w-5 h-5 text-charcoal-muted ml-2 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar fragancias, marcas..."
                className="flex-1 bg-transparent border-none outline-none text-charcoal font-body text-lg placeholder:text-charcoal-muted/50"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-2 text-charcoal-muted hover:text-charcoal transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isLoading && (
                <div className="absolute right-14">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto">
              {!query.trim() ? (
                <div className="p-12 text-center text-charcoal-muted font-body">
                  Escribe para buscar fragancias...
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-4 hover:bg-cream/30 transition-colors"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-cream shrink-0">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold text-xs font-display">
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-charcoal font-medium truncate">
                          {product.name}
                        </p>
                        {product.brands && (
                          <p className="font-body text-xs text-charcoal-muted truncate">
                            {product.brands.name}
                          </p>
                        )}
                      </div>
                      <div className="font-body font-medium text-charcoal shrink-0">
                        ${formatPrice(product.price)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="p-12 text-center text-charcoal-muted font-body">
                  No encontramos resultados para &quot;{query}&quot;
                </div>
              ) : (
                <div className="p-12" />
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-border bg-cream/30 text-center">
              <p className="text-[10px] text-charcoal-muted uppercase tracking-wider font-body">
                Presiona ESC para cerrar
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
