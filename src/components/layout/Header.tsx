"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/products" },
  { label: "Marcas", href: "/products?gender=all" }, // temporal hasta crear página de marcas
  { label: "Ofertas", href: "/products?sort=price_asc" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-sm border-b border-border py-3"
            : "bg-white py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-charcoal-muted hover:text-gold transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center md:justify-start gap-2 text-charcoal hover:text-gold transition-colors flex-1 md:flex-none"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 hidden sm:block">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-script text-3xl tracking-wide">Bendita Store</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-body text-charcoal-muted hover:text-gold transition-colors uppercase tracking-wider"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center justify-end gap-5 text-charcoal-muted flex-shrink-0">
            <button className="hover:text-gold transition-colors hidden md:block" aria-label="Buscar">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/account/wishlist" className="hover:text-gold transition-colors hidden sm:block" aria-label="Wishlist">
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
                <span className="absolute -top-2 -right-2 bg-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[80vw] h-full bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="font-script text-2xl text-charcoal hover:text-gold transition-colors"
              >
                Bendita Store
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal hover:bg-cream transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3.5 rounded-xl font-body text-charcoal-muted hover:text-gold hover:bg-cream transition-all uppercase tracking-wider text-sm"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Drawer footer */}
            <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-charcoal-muted hover:text-charcoal hover:bg-cream transition-all"
              >
                <User className="w-4 h-4" /> Mi cuenta
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-charcoal-muted hover:text-charcoal hover:bg-cream transition-all"
              >
                <Heart className="w-4 h-4" /> Wishlist
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
