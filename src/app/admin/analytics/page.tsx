"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  ShoppingCart,
  Users,
  TrendingUp,
  Search,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Package,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types";

// ── Helpers ────────────────────────────────────────────────────
function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    notation: n >= 1_000_000 ? "compact" : "standard",
  }).format(n);
}

function pct(num: number, den: number) {
  if (!den) return "0%";
  return ((num / den) * 100).toFixed(1) + "%";
}

// ── Date range options ─────────────────────────────────────────
const RANGES = [
  { label: "Hoy", days: 1 },
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
];

function getFromDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ── Types ──────────────────────────────────────────────────────
interface AnalyticsEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: string;
  page: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  color?: string;
  delay?: number;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, trend, color = "text-gold", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-border rounded-2xl p-5 shadow-sm"
    >
      <div className={`w-9 h-9 rounded-xl bg-cream-dark flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="font-display text-2xl text-charcoal font-semibold mb-0.5">{value}</p>
      <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-1">{label}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend !== undefined && trend !== null && (
            trend >= 0
              ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              : <ArrowDownRight className="w-3 h-3 text-red-400" />
          )}
          <p className={`font-body text-xs ${
            trend !== undefined && trend !== null
              ? trend >= 0 ? "text-emerald-500" : "text-red-500"
              : "text-charcoal-muted"
          }`}>{sub}</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="font-display text-xl text-charcoal">{title}</h2>
        <p className="font-body text-sm text-charcoal-muted">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Funnel Step ────────────────────────────────────────────────
function FunnelStep({
  step, label, desc, count, total, color,
}: {
  step: number; label: string; desc: string; count: number; total: number; color: string;
}) {
  const ratio = total > 0 ? count / total : 0;
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="font-body text-sm font-semibold text-charcoal">{label}</p>
            <p className="font-body text-xs text-charcoal-muted">{desc}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg text-charcoal">{count.toLocaleString("es-CO")}</p>
            <p className="font-body text-xs text-charcoal-muted">{pct(count, total)}</p>
          </div>
        </div>
        <div className="h-2 bg-cream rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`h-full ${color} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
}

// ── Bar Row ────────────────────────────────────────────────────
function BarRow({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const ratio = max > 0 ? value / max : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="font-body text-sm text-charcoal w-40 truncate shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.7 }}
          className="h-full bg-gold rounded-full"
        />
      </div>
      <p className="font-body text-sm text-charcoal-muted w-16 text-right shrink-0">
        {value.toLocaleString("es-CO")}{suffix}
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(7);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newUsers, setNewUsers] = useState<{ created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const from = getFromDate(rangeDays);

      const [evRes, ordRes, usrRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*")
          .gte("created_at", from)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, status, total, created_at, payment_method")
          .gte("created_at", from),
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", from),
      ]);

      setEvents((evRes.data as AnalyticsEvent[]) ?? []);
      setOrders((ordRes.data as Order[]) ?? []);
      setNewUsers((usrRes.data as { created_at: string }[]) ?? []);
      setLoading(false);
    }
    load();
  }, [rangeDays]);

  // ── Computed metrics ───────────────────────────────────────
  const metrics = useMemo(() => {
    const pageViews = events.filter((e) => e.event_type === "page_view");
    const productViews = events.filter((e) => e.event_type === "product_view");
    const addToCart = events.filter((e) => e.event_type === "add_to_cart");
    const beginCheckout = events.filter((e) => e.event_type === "begin_checkout");
    const searches = events.filter((e) => e.event_type === "search");
    const wishlistAdds = events.filter((e) => e.event_type === "wishlist_add");
    const wishlistRemoves = events.filter((e) => e.event_type === "wishlist_remove");

    // Unique sessions
    const allSessions = new Set(events.map((e) => e.session_id));
    const uniqueSessions = allSessions.size;

    // Sessions with only 1 page view = estimated "bounce"
    const sessionPageCounts: Record<string, number> = {};
    pageViews.forEach((e) => {
      sessionPageCounts[e.session_id] = (sessionPageCounts[e.session_id] ?? 0) + 1;
    });
    const bounceSessions = Object.values(sessionPageCounts).filter((c) => c === 1).length;
    const bounceRate = uniqueSessions > 0 ? (bounceSessions / uniqueSessions) * 100 : 0;

    // Revenue
    const completedOrders = orders.filter((o) =>
      ["paid", "processing", "shipped", "delivered"].includes(o.status)
    );
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    });

    // Most viewed products
    const productViewCount: Record<string, { name: string; count: number }> = {};
    productViews.forEach((e) => {
      const id = e.payload?.product_id as string;
      const name = (e.payload?.product_name as string) ?? id;
      if (!id) return;
      if (!productViewCount[id]) productViewCount[id] = { name, count: 0 };
      productViewCount[id].count++;
    });
    const topViewed = Object.values(productViewCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most added to cart
    const cartCount: Record<string, { name: string; count: number }> = {};
    addToCart.forEach((e) => {
      const id = e.payload?.product_id as string;
      const name = (e.payload?.product_name as string) ?? id;
      if (!id) return;
      if (!cartCount[id]) cartCount[id] = { name, count: 0 };
      cartCount[id].count++;
    });
    const topCart = Object.values(cartCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top search terms
    const searchTerms: Record<string, { count: number; noResults: number }> = {};
    searches.forEach((e) => {
      const term = (e.payload?.search_term as string)?.toLowerCase().trim();
      if (!term) return;
      if (!searchTerms[term]) searchTerms[term] = { count: 0, noResults: 0 };
      searchTerms[term].count++;
      if (e.payload?.has_results === false) searchTerms[term].noResults++;
    });
    const topSearches = Object.entries(searchTerms)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([term, data]) => ({ term, ...data }));

    // Funnel
    const funnel = {
      pageViews: pageViews.length,
      productViews: productViews.length,
      addToCart: addToCart.length,
      beginCheckout: beginCheckout.length,
      orders: orders.length,
    };

    return {
      pageViews: pageViews.length,
      uniqueSessions,
      bounceRate,
      productViews: productViews.length,
      addToCart: addToCart.length,
      totalRevenue,
      avgTicket,
      completedOrders: completedOrders.length,
      totalOrders: orders.length,
      ordersByStatus,
      topViewed,
      topCart,
      topSearches,
      searches: searches.length,
      wishlistAdds: wishlistAdds.length,
      wishlistRemoves: wishlistRemoves.length,
      funnel,
    };
  }, [events, orders]);

  const currentRange = RANGES.find((r) => r.days === rangeDays)?.label ?? "Personalizado";

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-400",
    paid: "bg-blue-400",
    processing: "bg-purple-400",
    shipped: "bg-cyan-400",
    delivered: "bg-emerald-400",
    cancelled: "bg-red-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Analytics</h1>
          <p className="font-body text-sm text-charcoal-muted">
            Qué está pasando en tu tienda, explicado de forma clara
          </p>
        </div>

        {/* Date range selector */}
        <div className="relative">
          <button
            onClick={() => setRangeOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl shadow-sm font-body text-sm text-charcoal hover:border-gold transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-gold" />
            {currentRange}
            <ChevronDown className={`w-4 h-4 text-charcoal-muted transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
          </button>
          {rangeOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => { setRangeDays(r.days); setRangeOpen(false); }}
                  className={`w-full text-left px-4 py-3 font-body text-sm transition-colors hover:bg-cream ${r.days === rangeDays ? "text-gold font-semibold bg-cream" : "text-charcoal"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="h-32 bg-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── 1. VISITAS ──────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<Eye className="w-5 h-5" />}
              title="Visitas a la tienda"
              subtitle="Cuántas personas entraron y qué tan interesadas estuvieron"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye className="w-4 h-4" />}
                label="Páginas vistas"
                value={metrics.pageViews.toLocaleString("es-CO")}
                sub="Total de páginas abiertas"
                delay={0}
              />
              <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Visitas únicas"
                value={metrics.uniqueSessions.toLocaleString("es-CO")}
                sub="Personas distintas que entraron"
                delay={0.05}
              />
              <StatCard
                icon={<Package className="w-4 h-4" />}
                label="Productos vistos"
                value={metrics.productViews.toLocaleString("es-CO")}
                sub="Veces que abrieron un producto"
                delay={0.1}
              />
              <StatCard
                icon={<BarChart3 className="w-4 h-4" />}
                label="Se fueron rápido"
                value={metrics.bounceRate.toFixed(0) + "%"}
                sub="Entraron y salieron sin explorar"
                delay={0.15}
              />
            </div>
          </section>

          {/* ── 2. VENTAS ───────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<TrendingUp className="w-5 h-5" />}
              title="Ventas y dinero"
              subtitle="Cuánto se vendió y cómo quedaron los pedidos"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Dinero recibido"
                value={formatCOP(metrics.totalRevenue)}
                sub="Pedidos pagados, procesando y entregados"
                color="text-emerald-500"
                delay={0}
              />
              <StatCard
                icon={<ShoppingCart className="w-4 h-4" />}
                label="Pedidos totales"
                value={metrics.totalOrders.toLocaleString("es-CO")}
                sub="Todos los pedidos del período"
                delay={0.05}
              />
              <StatCard
                icon={<BarChart3 className="w-4 h-4" />}
                label="Valor promedio por pedido"
                value={formatCOP(metrics.avgTicket)}
                sub="Cuánto gasta en promedio cada cliente"
                delay={0.1}
              />
              <StatCard
                icon={<ShoppingCart className="w-4 h-4" />}
                label="Agregaron al carrito"
                value={metrics.addToCart.toLocaleString("es-CO")}
                sub="Veces que añadieron un producto"
                delay={0.15}
              />
            </div>

            {/* Orders by status */}
            {Object.keys(metrics.ordersByStatus).length > 0 && (
              <div>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-3">Estado de los pedidos</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cream border border-border rounded-full"
                    >
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? "bg-charcoal-muted"}`} />
                      <span className="font-body text-xs text-charcoal">
                        {STATUS_LABELS[status] ?? status}: <strong>{count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── 3. PRODUCTOS ────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<Package className="w-5 h-5" />}
              title="Productos más populares"
              subtitle="Cuáles atraen más miradas y cuáles terminan en el carrito"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-4">
                  Más veces abiertos
                </p>
                {metrics.topViewed.length === 0 ? (
                  <p className="font-body text-sm text-charcoal-muted">Sin datos aún</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.topViewed.map((p) => (
                      <BarRow
                        key={p.name}
                        label={p.name}
                        value={p.count}
                        max={metrics.topViewed[0]?.count ?? 1}
                        suffix=" veces"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-4">
                  Más agregados al carrito
                </p>
                {metrics.topCart.length === 0 ? (
                  <p className="font-body text-sm text-charcoal-muted">Sin datos aún</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.topCart.map((p) => (
                      <BarRow
                        key={p.name}
                        label={p.name}
                        value={p.count}
                        max={metrics.topCart[0]?.count ?? 1}
                        suffix=" veces"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── 4. EMBUDO ───────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<ArrowUpRight className="w-5 h-5" />}
              title="Camino hacia la compra"
              subtitle="De cada 100 personas que entran, cuántas terminan comprando"
            />
            <div className="space-y-5">
              <FunnelStep
                step={1}
                label="Entraron a la tienda"
                desc="Visitaron cualquier página"
                count={metrics.funnel.pageViews}
                total={metrics.funnel.pageViews}
                color="bg-blue-400"
              />
              <FunnelStep
                step={2}
                label="Vieron un producto"
                desc="Abrieron la página de al menos un perfume"
                count={metrics.funnel.productViews}
                total={metrics.funnel.pageViews}
                color="bg-purple-400"
              />
              <FunnelStep
                step={3}
                label="Añadieron al carrito"
                desc="Pusieron algo en el carrito"
                count={metrics.funnel.addToCart}
                total={metrics.funnel.pageViews}
                color="bg-amber-400"
              />
              <FunnelStep
                step={4}
                label="Empezaron a pagar"
                desc="Llegaron hasta la pantalla de pago"
                count={metrics.funnel.beginCheckout}
                total={metrics.funnel.pageViews}
                color="bg-orange-400"
              />
              <FunnelStep
                step={5}
                label="Compraron"
                desc="Pedido confirmado"
                count={metrics.funnel.orders}
                total={metrics.funnel.pageViews}
                color="bg-emerald-400"
              />
            </div>
            {metrics.funnel.pageViews > 0 && (
              <div className="mt-6 p-4 bg-cream rounded-xl border border-border">
                <p className="font-body text-sm text-charcoal">
                  <strong className="text-gold">{pct(metrics.funnel.orders, metrics.funnel.pageViews)}</strong>
                  {" "}de las personas que entraron a la tienda terminaron comprando.
                  {metrics.funnel.pageViews > 0 && metrics.funnel.addToCart > 0 && (
                    <> De quienes pusieron algo al carrito, el{" "}
                      <strong className="text-gold">{pct(metrics.funnel.orders, metrics.funnel.addToCart)}</strong>
                      {" "}completó el pedido.</>
                  )}
                </p>
              </div>
            )}
          </section>

          {/* ── 5. BÚSQUEDAS ────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<Search className="w-5 h-5" />}
              title="Qué buscan tus clientes"
              subtitle="Las palabras que escriben en el buscador de la tienda"
            />
            {metrics.topSearches.length === 0 ? (
              <p className="font-body text-sm text-charcoal-muted">
                Aún no hay búsquedas registradas en este período.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest">Término</p>
                  <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest text-center">Búsquedas</p>
                  <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest text-right">Sin resultados</p>
                </div>
                {metrics.topSearches.map(({ term, count, noResults }) => (
                  <div key={term} className="grid grid-cols-3 gap-2 py-2.5 border-b border-border last:border-0">
                    <p className="font-body text-sm text-charcoal font-medium capitalize">{term}</p>
                    <p className="font-body text-sm text-charcoal text-center">{count}</p>
                    <div className="text-right">
                      {noResults > 0 ? (
                        <span className="inline-flex px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-full font-body text-xs">
                          {noResults} sin resultados
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full font-body text-xs">
                          Con resultados
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="font-body text-xs text-charcoal-muted mt-3">
                  💡 Los términos marcados como &quot;sin resultados&quot; son productos que tus clientes piden pero no encuentran. Considera agregarlos.
                </p>
              </div>
            )}
          </section>

          {/* ── 6. CLIENTES ─────────────────────────────────────── */}
          <section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<Users className="w-5 h-5" />}
              title="Clientes nuevos"
              subtitle="Personas que crearon su cuenta en este período"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Cuentas nuevas"
                value={newUsers.length.toLocaleString("es-CO")}
                sub={`En los últimos ${rangeDays} días`}
                color="text-purple-400"
                delay={0}
              />
              <StatCard
                icon={<Heart className="w-4 h-4" />}
                label="Guardaron en wishlist"
                value={metrics.wishlistAdds.toLocaleString("es-CO")}
                sub="Productos marcados como favoritos"
                color="text-rose-400"
                delay={0.05}
              />
              <StatCard
                icon={<Search className="w-4 h-4" />}
                label="Búsquedas hechas"
                value={metrics.searches.toLocaleString("es-CO")}
                sub="Veces que usaron el buscador"
                delay={0.1}
              />
              <StatCard
                icon={<ShoppingCart className="w-4 h-4" />}
                label="Llegaron al pago"
                value={metrics.funnel.beginCheckout.toLocaleString("es-CO")}
                sub="Iniciaron el proceso de compra"
                color="text-amber-500"
                delay={0.15}
              />
            </div>
          </section>

          {/* ── Empty state if no events at all ─────────────────── */}
          {events.length === 0 && orders.length === 0 && (
            <div className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm">
              <BarChart3 className="w-12 h-12 text-gold/30 mx-auto mb-4" />
              <p className="font-display text-xl text-charcoal mb-2">
                Aún no hay datos para este período
              </p>
              <p className="font-body text-sm text-charcoal-muted max-w-sm mx-auto">
                Los datos aparecerán aquí a medida que los clientes visiten la tienda.
                Asegúrate de que la migración de base de datos esté aplicada.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
