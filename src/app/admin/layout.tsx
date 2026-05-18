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
  Tag,
  Layers,
  Droplets,
  Wallet,
  Receipt,
  Archive,
  FileText,
  Settings,
} from "lucide-react";
import { signOut } from "@/lib/supabase/auth";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/orders", icon: ShoppingBag, label: "Órdenes" },
  { href: "/admin/accounting", icon: Wallet, label: "Contabilidad", exact: true },
  { href: "/admin/accounting/gastos", icon: Receipt, label: "Gastos" },
  { href: "/admin/accounting/inventario", icon: Archive, label: "Inventario" },
  { href: "/admin/accounting/reportes", icon: FileText, label: "Reportes" },
  { href: "/admin/users", icon: Users, label: "Usuarios" },
  { href: "/admin/settings", icon: Settings, label: "Configuración" },
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
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
            <Gem className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-script text-gold text-sm leading-none">Bendita</p>
            <p className="font-body text-[9px] uppercase tracking-widest text-charcoal-muted">
              Admin Panel
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all ${
                isActive
                  ? "bg-cream border border-border text-charcoal font-semibold"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-cream-dark"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-charcoal" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Signout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white border border-border shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white font-bold text-sm">
            {(user?.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs text-charcoal truncate">
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
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl font-body text-sm text-charcoal-muted hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
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
      .then(({ data }: { data: any }) => {
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
          <p className="font-body text-xs text-charcoal-muted">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-border">
        <AdminSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" />
          <aside
            className="relative w-72 bg-white border-r border-border h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-white sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-gold" />
            <span className="font-script text-gold text-sm">Bendita Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
