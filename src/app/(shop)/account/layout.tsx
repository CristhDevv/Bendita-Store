"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
      <div className="bg-white border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center text-white font-display font-bold text-xl select-none">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-body font-medium text-charcoal truncate">{displayName}</p>
            <p className="font-body text-xs text-charcoal-muted truncate">{user?.email}</p>
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
                    ? "bg-cream text-charcoal border border-border shadow-sm font-medium"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-cream"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-charcoal-muted" />}
              </Link>
            );
          })}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-charcoal-muted hover:text-red-600 hover:bg-red-50 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-sm px-2 pb-safe">
      <div className="flex items-center justify-around">
        {ALL_TABS.map(({ href, icon: Icon, label }) => {
          if (href === "__signout__") {
            return (
              <button
                key="signout"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex flex-col items-center gap-1 py-3 px-2 text-charcoal-muted hover:text-red-600 transition-colors disabled:opacity-50"
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
                isActive ? "text-charcoal font-medium" : "text-charcoal-muted hover:text-charcoal"
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Verificar si Supabase está configurado
  const isSupabaseConfigured = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

  useEffect(() => {
    if (authLoading) return;
    
    if (!isSupabaseConfigured) {
      console.warn("Supabase no está configurado. Redirigiendo a inicio...");
      router.replace("/");
      return;
    }

    if (!user) {
      router.replace("/login");
    }
  }, [user, authLoading, router, isSupabaseConfigured]);

  if (authLoading || !user || !isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-24 lg:pb-8">
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
