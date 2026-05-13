"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    // Verificar estado inicial
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-navy-950/80 backdrop-blur-xl border-b border-gold-500/20 py-3"
          : "bg-navy-950 py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Mobile menu button (Izquierda en mobile) */}
        <button className="md:hidden text-crystal hover:text-gold transition-colors flex-shrink-0">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo (Centro en mobile, Izquierda en desktop) */}
        <Link
          href="/"
          className="flex items-center justify-center md:justify-start gap-2 text-gold hover:text-gold-400 transition-colors flex-1 md:flex-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 hidden sm:block"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="font-script text-3xl tracking-wide">Bendita Store</span>
        </Link>

        {/* Desktop Nav (Centro) */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Inicio", "Catálogo", "Marcas", "Ofertas"].map((item) => (
            <Link
              key={item}
              href={item === "Inicio" ? "/" : `/${item.toLowerCase()}`}
              className="text-sm font-body text-crystal/70 hover:text-gold transition-colors uppercase tracking-wider"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Icons (Derecha) */}
        <div className="flex items-center justify-end gap-5 text-crystal flex-shrink-0">
          <button className="hover:text-gold transition-colors hidden md:block" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/wishlist" className="hover:text-gold transition-colors hidden sm:block" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
          </Link>
          <Link href="/account" className="hover:text-gold transition-colors hidden sm:block" aria-label="Perfil">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => useCartStore.getState().openCart()}
            className="relative hover:text-gold transition-colors flex items-center"
            aria-label="Carrito"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-navy-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
