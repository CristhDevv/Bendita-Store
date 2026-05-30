"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types";

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_users: number;
  pending_orders: number;
  monthly_revenue: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  paid: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  processing: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  shipped: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  delivered: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  confirmed: "text-teal-400 bg-teal-400/10 border-teal-400/20",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  confirmed: "Confirmado",
};

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    notation: amount >= 1_000_000 ? "compact" : "standard",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

// ─── 7-Day SVG Sales Chart ────────────────────────────────────
function SalesChart({ orders }: { orders: Order[] }) {
  // Build last 7 days with daily totals
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailyTotals = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = orders
      .filter((o) => {
        const t = new Date(o.created_at);
        return t >= day && t < next;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return { day, total };
  });

  const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);

  // Chart dimensions
  const W = 500;
  const H = 140;
  const PADDING = { top: 12, right: 12, bottom: 28, left: 0 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const points = dailyTotals.map((d, i) => ({
    x: PADDING.left + (i / (dailyTotals.length - 1)) * chartW,
    y: PADDING.top + chartH - (d.total / maxTotal) * chartH,
    total: d.total,
    label: d.day.toLocaleDateString("es-CO", { weekday: "short" }),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PADDING.top + chartH} L ${points[0].x} ${PADDING.top + chartH} Z`;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="bg-white border border-border shadow-sm rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg text-charcoal">Ventas — Últimos 7 días</h2>
          <p className="font-body text-xs text-charcoal-muted">Ingresos diarios en COP</p>
        </div>
        <TrendingUp className="w-4 h-4 text-gold" />
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ overflow: "visible" }}
      >
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={PADDING.left}
            y1={PADDING.top + chartH * (1 - t)}
            x2={W - PADDING.right}
            y2={PADDING.top + chartH * (1 - t)}
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8a04a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c8a04a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#salesGrad)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#c8a04a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + hover */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Hover area */}
            <rect
              x={i === 0 ? p.x : points[i - 1].x + (p.x - points[i - 1].x) / 2}
              y={PADDING.top}
              width={
                i === 0
                  ? (points[1].x - p.x) / 2
                  : i === points.length - 1
                  ? (p.x - points[i - 1].x) / 2
                  : (points[i + 1].x - points[i - 1].x) / 2
              }
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 5 : 3}
              fill={hovered === i ? "#c8a04a" : "#ffffff"}
              stroke="#c8a04a"
              strokeWidth="2"
              style={{ transition: "r 150ms" }}
            />
            {/* Tooltip */}
            {hovered === i && (
              <g>
                <rect
                  x={Math.min(p.x - 42, W - 90)}
                  y={p.y - 36}
                  width="84"
                  height="26"
                  rx="6"
                  fill="#ffffff"
                  stroke="#E8E4DC"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(p.x, W - 48) + (p.x > W - 90 ? -42 : 0)}
                  y={p.y - 20}
                  textAnchor="middle"
                  fill="#c8a04a"
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                >
                  {formatCOP(p.total)}
                </text>
              </g>
            )}
            {/* Day label */}
            <text
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fill="#6B6B6B"
              fontSize="9"
              fontFamily="Inter, sans-serif"
              style={{ textTransform: "capitalize" }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Get stats from RPC, recent orders, and last 30 days for chart
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [{ data: statsData }, { data: ordersData }, { data: chartOrders }] =
        await Promise.all([
          supabase.rpc("get_admin_dashboard_stats"),
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("orders")
            .select("total, created_at, status")
            .gte("created_at", sevenDaysAgo.toISOString())
            .eq("status", "confirmed"),
        ]);

      setStats(statsData as DashboardStats);
      setRecentOrders((ordersData as Order[]) || []);
      setAllOrders((chartOrders as Order[]) || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Today's sales
  const todaySales = allOrders
    .filter((o) =>
      new Date(o.created_at).toDateString() === new Date().toDateString() &&
      o.status === "confirmed"
    )
    .reduce((sum, o) => sum + o.total, 0);

  const yesterdaySales = allOrders
    .filter((o) => {
      const y = new Date(); y.setDate(y.getDate() - 1);
      return new Date(o.created_at).toDateString() === y.toDateString() &&
        o.status === "confirmed";
    })
    .reduce((sum, o) => sum + o.total, 0);

  const salesTrend = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : null;

  const KPI_CARDS = stats
    ? [
        {
          label: "Ventas Hoy",
          value: formatCOP(todaySales),
          sub: salesTrend !== null
            ? `${salesTrend >= 0 ? "+" : ""}${salesTrend.toFixed(0)}% vs ayer`
            : "Sin comparativa",
          trend: salesTrend,
          Icon: DollarSign,
          color: "from-gold-400/20 to-gold-600/5",
          iconColor: "text-gold",
        },
        {
          label: "Órdenes Pendientes",
          value: stats.pending_orders.toLocaleString("es-CO"),
          sub: `de ${stats.total_orders} totales`,
          trend: null,
          Icon: Clock,
          color: "from-amber-500/20 to-amber-600/5",
          iconColor: "text-amber-400",
        },
        {
          label: "Productos Activos",
          value: stats.total_products.toLocaleString("es-CO"),
          sub: "En catálogo",
          trend: null,
          Icon: Package,
          color: "from-purple-500/20 to-purple-600/5",
          iconColor: "text-purple-400",
        },
        {
          label: "Clientes",
          value: stats.total_users.toLocaleString("es-CO"),
          sub: "Registrados",
          trend: null,
          Icon: Users,
          color: "from-emerald-500/20 to-emerald-600/5",
          iconColor: "text-emerald-400",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Dashboard</h1>
          <p className="font-body text-sm text-charcoal-muted">
            Resumen general de Bendita Store
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span className="font-body text-xs text-charcoal-muted">Tiempo real</span>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, sub, trend, Icon, color, iconColor }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="relative bg-white border border-border shadow-sm rounded-2xl p-5 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg bg-cream-dark flex items-center justify-center mb-3 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-display text-2xl text-charcoal font-semibold mb-0.5">{value}</p>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest">{label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {trend !== null && (
                    trend >= 0
                      ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      : <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <p className={`font-body text-xs ${
                    trend !== null
                      ? trend >= 0 ? "text-emerald-500" : "text-red-500"
                      : "text-charcoal-muted"
                  }`}>
                    {sub}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SVG Sales Chart */}
      {loading ? (
        <div className="h-48 bg-border rounded-2xl animate-pulse" />
      ) : (
        <SalesChart orders={allOrders} />
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-charcoal">Últimos Pedidos</h2>
          <a
            href="/admin/orders"
            className="flex items-center gap-1.5 font-body text-xs text-charcoal-muted hover:text-gold transition-colors"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center shadow-sm">
            <ShoppingBag className="w-8 h-8 text-gold/20 mx-auto mb-2" />
            <p className="font-body text-sm text-charcoal-muted">Sin pedidos aún</p>
          </div>
        ) : (
          <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="flex flex-col divide-y divide-border">
              {recentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-cream/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-charcoal font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-xs text-charcoal-muted">{formatDate(order.created_at)}</span>
                      {order.payment_method && (
                        <>
                          <span className="text-border">•</span>
                          <span className="font-body text-xs text-charcoal-muted capitalize">{order.payment_method}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider font-body border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    
                    <p className="font-display text-sm text-charcoal font-semibold w-24 text-right">
                      {formatCOP(order.total)}
                    </p>
                    
                    <a
                      href="/admin/orders"
                      className="w-8 h-8 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-gold transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
