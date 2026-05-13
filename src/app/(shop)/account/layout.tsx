"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingBag,
  Heart,
  MapPin,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut } from "@/lib/supabase/auth";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/account/orders", icon: ShoppingBag, label: "Mis Pedidos" },
  { href: "/account/wishlist", icon: Heart, label: "Mi Wishlist" },
  { href: "/account/addresses", icon: MapPin, label: "Mis Direcciones" },
  { href: "/account/profile", icon: User, label: "Datos Personales" },
];

function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0">
      <div className="glass border border-gold-500/20 rounded-2xl p-6 sticky top-24">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gold-500/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-display font-bold text-xl select-none">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-body font-medium text-crystal truncate">{displayName}</p>
            <p className="font-body text-xs text-crystal/50 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all ${
                  isActive
                    ? "bg-gold-500/15 text-gold border border-gold-500/30"
                    : "text-crystal/70 hover:text-crystal hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-gold/70" />}
              </Link>
            );
          })}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-crystal/50 hover:text-red-400 hover:bg-red-500/5 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <LogOut className="w-4 h-4 shrink-0" />
            )}
            <span>{signingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  const ALL_TABS = [
    ...NAV_ITEMS,
    { href: "__signout__", icon: LogOut, label: "Salir" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-gold-500/15 px-2 pb-safe">
      <div className="flex items-center justify-around">
        {ALL_TABS.map(({ href, icon: Icon, label }) => {
          if (href === "__signout__") {
            return (
              <button
                key="signout"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex flex-col items-center gap-1 py-3 px-2 text-crystal/40 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {signingOut ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-body">{label}</span>
              </button>
            );
          }
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                isActive ? "text-gold" : "text-crystal/40 hover:text-crystal/70"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-body">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-24 lg:pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex gap-8">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
