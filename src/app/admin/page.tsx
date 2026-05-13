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
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
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
    <div className="glass border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg text-crystal">Ventas — Últimos 7 días</h2>
          <p className="font-body text-xs text-crystal/40">Ingresos diarios en COP</p>
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
            stroke="rgba(255,255,255,0.04)"
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
              fill={hovered === i ? "#c8a04a" : "#1e1a2e"}
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
                  fill="rgba(15,12,30,0.95)"
                  stroke="rgba(200,160,74,0.3)"
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
              fill="rgba(235,230,220,0.35)"
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
            .select("total, created_at")
            .gte("created_at", sevenDaysAgo.toISOString()),
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
    .filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);

  const yesterdaySales = allOrders
    .filter((o) => {
      const y = new Date(); y.setDate(y.getDate() - 1);
      return new Date(o.created_at).toDateString() === y.toDateString();
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
          <h1 className="font-display text-3xl text-crystal mb-1">Dashboard</h1>
          <p className="font-body text-sm text-crystal/50">
            Resumen general de Bendita Store
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass border border-gold-500/20 rounded-xl">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span className="font-body text-xs text-crystal/70">Tiempo real</span>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
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
              className="relative glass border border-white/5 rounded-2xl p-5 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-50`} />
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-display text-2xl text-crystal mb-0.5">{value}</p>
                <p className="font-body text-xs text-crystal/40 uppercase tracking-widest">{label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {trend !== null && (
                    trend >= 0
                      ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      : <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <p className={`font-body text-xs ${
                    trend !== null
                      ? trend >= 0 ? "text-emerald-400" : "text-red-400"
                      : "text-crystal/30"
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
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
      ) : (
        <SalesChart orders={allOrders} />
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-crystal">Últimos Pedidos</h2>
          <a
            href="/admin/orders"
            className="flex items-center gap-1.5 font-body text-xs text-gold hover:text-gold-300 transition-colors"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="glass border border-gold-500/10 rounded-xl p-8 text-center">
            <ShoppingBag className="w-8 h-8 text-gold/20 mx-auto mb-2" />
            <p className="font-body text-sm text-crystal/40">Sin pedidos aún</p>
          </div>
        ) : (
          <div className="glass border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-crystal/30">Pedido</th>
                    <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-crystal/30">Fecha</th>
                    <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-widest text-crystal/30">Estado</th>
                    <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-widest text-crystal/30">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-body text-sm text-crystal font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        {order.payment_method && (
                          <p className="font-body text-xs text-crystal/40 capitalize">{order.payment_method}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-crystal/60">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body border ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-display text-sm text-gold">{formatCOP(order.total)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href="/admin/orders"
                          className="font-body text-xs text-gold/60 hover:text-gold transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
