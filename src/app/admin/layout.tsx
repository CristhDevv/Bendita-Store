"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Gem,
  Loader2,
} from "lucide-react";
import { signOut } from "@/lib/supabase/auth";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/products", icon: Package, label: "Productos" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Órdenes" },
  { href: "/admin/users", icon: Users, label: "Usuarios" },
];

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
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

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-gold-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <Gem className="w-4 h-4 text-navy-950" />
          </div>
          <div>
            <p className="font-script text-gold text-sm leading-none">Bendita</p>
            <p className="font-body text-[9px] uppercase tracking-widest text-crystal/40">
              Admin Panel
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg glass flex items-center justify-center text-crystal/40 hover:text-crystal lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all ${
                isActive
                  ? "bg-gold-500/15 text-gold border border-gold-500/30"
                  : "text-crystal/60 hover:text-crystal hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-gold/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Signout */}
      <div className="p-4 border-t border-gold-500/10">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl glass border border-gold-500/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-sm">
            {(user?.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs text-crystal truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-gold" />
              <p className="font-body text-[10px] text-gold">Administrador</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl font-body text-sm text-crystal/40 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
        >
          {signingOut ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {signingOut ? "Cerrando..." : "Cerrar Sesión"}
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }

    // Verify is_admin in profiles table
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data?.is_admin) {
          router.replace("/");
        } else {
          setAdminChecked(true);
        }
      });
  }, [user, authLoading, router]);

  // Show loading while checking admin status
  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <Gem className="w-6 h-6 text-navy-950" />
          </div>
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
          <p className="font-body text-xs text-crystal/40">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-navy-900/50 border-r border-gold-500/10">
        <AdminSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" />
          <aside
            className="relative w-72 bg-navy-900 border-r border-gold-500/10 h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gold-500/10 glass sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg glass flex items-center justify-center text-crystal/60 hover:text-crystal"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-gold" />
            <span className="font-script text-gold text-sm">Bendita Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
