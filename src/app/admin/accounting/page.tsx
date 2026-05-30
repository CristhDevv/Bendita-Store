"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
  Activity,
  ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Tipos
interface AccountingStats {
  revenue: number;
  cost: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

type Period = "hoy" | "semana" | "mes" | "ano" | "custom";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    notation: amount >= 1_000_000 ? "compact" : "standard",
  }).format(amount);
}

// ─── SVG Chart (Ingresos vs Gastos) ───────────────────────────
function IncomeVsExpenseChart({
  orders,
  expenses,
  startDate,
  endDate,
}: {
  orders: any[];
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
}) {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
  
  const daysToShow = Math.min(diffDays + 1, 60);
  
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - (daysToShow - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailyData = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    
    const income = orders
      .filter((o) => {
        const t = new Date(o.created_at);
        return t >= day && t < next;
      })
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
    const expenseTotal = expenses
      .filter((e) => {
        const [y, m, d] = e.date.split("-").map(Number);
        const t = new Date(y, m - 1, d);
        return t >= day && t < next;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return { day, income, expense: expenseTotal };
  });

  const maxVal = Math.max(...dailyData.map((d) => Math.max(d.income, d.expense)), 1);

  const W = 600;
  const H = 200;
  const PADDING = { top: 20, right: 20, bottom: 30, left: 20 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const getPoint = (val: number, i: number) => ({
    x: PADDING.left + (i / (dailyData.length - 1 || 1)) * chartW,
    y: PADDING.top + chartH - (val / maxVal) * chartH,
  });

  const incomePoints = dailyData.map((d, i) => getPoint(d.income, i));
  const expensePoints = dailyData.map((d, i) => getPoint(d.expense, i));

  const buildPath = (pts: {x: number, y: number}[]) => 
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const [hovered, setHovered] = useState<number | null>(null);

  if (dailyData.length <= 1) {
    return <div className="h-[200px] flex items-center justify-center text-charcoal-muted">No hay suficientes datos para graficar</div>;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={PADDING.left}
            y1={PADDING.top + chartH * (1 - t)}
            x2={W - PADDING.right}
            y2={PADDING.top + chartH * (1 - t)}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Income Line */}
        <path d={buildPath(incomePoints)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Expense Line */}
        <path d={buildPath(expensePoints)} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interaction Layer */}
        {dailyData.map((d, i) => (
          <g key={i}>
            <rect
              x={i === 0 ? incomePoints[0].x : incomePoints[i - 1].x + (incomePoints[i].x - incomePoints[i - 1].x) / 2}
              y={PADDING.top}
              width={i === 0 ? (incomePoints[1].x - incomePoints[0].x) / 2 : i === dailyData.length - 1 ? (incomePoints[i].x - incomePoints[i - 1].x) / 2 : (incomePoints[i + 1].x - incomePoints[i - 1].x) / 2}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            
            {/* Dots on Hover */}
            {hovered === i && (
              <>
                <circle cx={incomePoints[i].x} cy={incomePoints[i].y} r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
                <circle cx={expensePoints[i].x} cy={expensePoints[i].y} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <line x1={incomePoints[i].x} y1={PADDING.top} x2={incomePoints[i].x} y2={PADDING.top + chartH} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 4" />
                
                <g transform={`translate(${Math.max(PADDING.left + 40, Math.min(W - PADDING.right - 80, incomePoints[i].x))}, ${PADDING.top - 10})`}>
                  <rect x="-45" y="-15" width="90" height="40" rx="4" fill="#fff" stroke="#e5e7eb" className="shadow-sm" />
                  <text x="0" y="0" textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="bold">+{formatCOP(d.income)}</text>
                  <text x="0" y="12" textAnchor="middle" fontSize="9" fill="#f43f5e" fontWeight="bold">-{formatCOP(d.expense)}</text>
                  <text x="0" y="20" textAnchor="middle" fontSize="7" fill="#6b7280">{d.day.toLocaleDateString("es-CO", { month: "short", day: "numeric" })}</text>
                </g>
              </>
            )}
          </g>
        ))}
      </svg>
      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="font-body text-xs text-charcoal-muted">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="font-body text-xs text-charcoal-muted">Gastos</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────
export default function AccountingPage() {
  const [period, setPeriod] = useState<Period>("mes");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Handle Period Change
  useEffect(() => {
    const today = new Date();
    let from = new Date();
    const to = today.toISOString().split("T")[0];

    switch (period) {
      case "hoy":
        from = today;
        break;
      case "semana":
        from.setDate(today.getDate() - 7);
        break;
      case "mes":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "ano":
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        return; // Usa los valores actuales de dateRange
    }
    setDateRange({ from: from.toISOString().split("T")[0], to });
  }, [period]);

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Fetch Stats via RPC
      const { data: statsData } = await supabase.rpc("get_accounting_stats", {
        p_from: dateRange.from,
        p_to: dateRange.to,
      });

      if (statsData) setStats(statsData as AccountingStats);

      // 2. Fetch Expenses for the period
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to)
        .order("date", { ascending: false });
      
      setExpenses((expensesData as Expense[]) || []);

      // 3. Fetch Orders for the period
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["paid", "processing", "shipped", "delivered"])
        .gte("created_at", `${dateRange.from}T00:00:00Z`)
        .lte("created_at", `${dateRange.to}T23:59:59Z`);
        
      setOrders(ordersData || []);

      setLoading(false);
    }
    fetchData();
  }, [dateRange]);

  const KPI_CARDS = stats ? [
    { label: "Ingresos", value: stats.revenue, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-600/5", icon: TrendingUp },
    { label: "Costo de ventas", value: stats.cost, color: "text-rose-500", bg: "from-rose-500/20 to-rose-600/5", icon: Package },
    { label: "Utilidad bruta", value: stats.gross_profit, color: "text-gold", bg: "from-gold-400/20 to-gold-600/5", icon: Activity },
    { label: "Utilidad neta", value: stats.net_profit, color: stats.net_profit >= 0 ? "text-emerald-500" : "text-rose-500", bg: "from-blue-500/20 to-blue-600/5", icon: DollarSign },
  ] : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Contabilidad</h1>
          <p className="font-body text-sm text-charcoal-muted">
            Análisis financiero y control de gastos
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {(["hoy", "semana", "mes", "ano"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl border text-sm font-body transition-colors ${
                period === p
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-charcoal border-border hover:bg-cream"
              }`}
            >
              {p === "hoy" ? "Hoy" : p === "semana" ? "Semana" : p === "mes" ? "Mes" : "Año"}
            </button>
          ))}
          
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-charcoal-muted" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => { setPeriod("custom"); setDateRange(prev => ({ ...prev, from: e.target.value }))}}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
            <span className="text-charcoal-muted">a</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => { setPeriod("custom"); setDateRange(prev => ({ ...prev, to: e.target.value }))}}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-border rounded-2xl animate-pulse" />)
        ) : (
          KPI_CARDS.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative bg-white border border-border shadow-sm rounded-2xl p-5 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bg} opacity-10`} />
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg bg-cream-dark flex items-center justify-center mb-3 ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-display text-2xl text-charcoal font-semibold mb-0.5">
                    {formatCOP(kpi.value)}
                  </p>
                  <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest">{kpi.label}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Navegación a Submódulos */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Link href="/admin/accounting" className="px-6 py-4 bg-charcoal text-white rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1">
          Resumen
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/admin/accounting/gastos" className="px-6 py-4 bg-white border border-border text-charcoal rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-gold">
          Gastos
          <ArrowRight className="w-4 h-4 text-charcoal-muted" />
        </Link>
        <Link href="/admin/accounting/inventario" className="px-6 py-4 bg-white border border-border text-charcoal rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-gold">
          Inventario
          <ArrowRight className="w-4 h-4 text-charcoal-muted" />
        </Link>
        <Link href="/admin/accounting/reportes" className="px-6 py-4 bg-white border border-border text-charcoal rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-gold">
          Reportes
          <ArrowRight className="w-4 h-4 text-charcoal-muted" />
        </Link>
        <Link href="/admin/accounting/insumos" className="px-6 py-4 bg-white border border-border text-charcoal rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-gold">
          Insumos
          <ArrowRight className="w-4 h-4 text-charcoal-muted" />
        </Link>
        <Link href="/admin/accounting/lotes" className="px-6 py-4 bg-white border border-border text-charcoal rounded-xl font-body font-medium flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-gold">
          Lotes de Producción
          <ArrowRight className="w-4 h-4 text-charcoal-muted" />
        </Link>
      </div>

      {/* RESUMEN (Gráfica) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="bg-white border border-border shadow-sm rounded-2xl p-6">
          <h3 className="font-display text-lg text-charcoal mb-6">Flujo de Caja (Ingresos vs Gastos)</h3>
          {loading ? (
            <div className="h-[200px] bg-cream rounded-xl animate-pulse" />
          ) : (
            <IncomeVsExpenseChart 
              orders={orders} 
              expenses={expenses} 
              startDate={new Date(dateRange.from)} 
              endDate={new Date(dateRange.to)} 
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
