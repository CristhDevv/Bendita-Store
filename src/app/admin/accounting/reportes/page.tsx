"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileText,
  Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────
type Period = "hoy" | "semana" | "mes" | "ano" | "custom";

interface AccountingStats {
  revenue: number;
  cost: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
}

// ─── Helpers ────────────────────────────────────────────────────
function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    notation: amount >= 1_000_000 ? "compact" : "standard",
  }).format(amount);
}

function getPeriodDates(period: Period, customRange: { from: string; to: string }) {
  if (period === "custom") return customRange;
  const today = new Date();
  const to = today.toISOString().split("T")[0];
  let from = new Date();
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
  }
  return { from: from.toISOString().split("T")[0], to };
}

function escapeCsvField(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Main Component ─────────────────────────────────────────────
export default function ReportesPage() {
  const supabase = createClient();

  // Period state
  const [period, setPeriod] = useState<Period>("mes");
  const [customRange, setCustomRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const dateRange = getPeriodDates(period, customRange);

  // Stats
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Export loading states
  const [exportingIngresos, setExportingIngresos] = useState(false);
  const [exportingGastos, setExportingGastos] = useState(false);
  const [exportingInventario, setExportingInventario] = useState(false);

  // ─── Fetch Stats ────────────────────────────────────────────
  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      const { data } = await supabase.rpc("get_accounting_stats", {
        p_from: dateRange.from,
        p_to: dateRange.to,
      });
      if (data) setStats(data as AccountingStats);
      setStatsLoading(false);
    }
    fetchStats();
  }, [dateRange.from, dateRange.to]);

  // ─── Export: Ingresos ────────────────────────────────────────
  const exportIngresos = async () => {
    setExportingIngresos(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, notes, payment_method, total")
        .in("status", ["paid", "processing", "shipped", "delivered"])
        .gte("created_at", `${dateRange.from}T00:00:00Z`)
        .lte("created_at", `${dateRange.to}T23:59:59Z`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["ID Orden", "Fecha", "Cliente (Notas)", "Método de Pago", "Total COP"];
      const rows = (data || []).map((o: { id: string; created_at: string; notes: string | null; payment_method: string | null; total: number | null }) => [
        o.id,
        new Date(o.created_at).toLocaleDateString("es-CO"),
        o.notes || "",
        o.payment_method || "",
        String(o.total || 0),
      ]);

      downloadCsv(`ingresos_${dateRange.from}_${dateRange.to}.csv`, [headers, ...rows]);
    } catch (e) {
      console.error("Error exportando ingresos:", e);
    } finally {
      setExportingIngresos(false);
    }
  };

  // ─── Export: Gastos ──────────────────────────────────────────
  const exportGastos = async () => {
    setExportingGastos(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("date, category, description, amount")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to)
        .order("date", { ascending: false });

      if (error) throw error;

      const headers = ["Fecha", "Categoría", "Descripción", "Monto COP"];
      const rows = (data || []).map((e) => [
        e.date,
        e.category || "",
        e.description || "",
        String(e.amount || 0),
      ]);

      downloadCsv(`gastos_${dateRange.from}_${dateRange.to}.csv`, [headers, ...rows]);
    } catch (e) {
      console.error("Error exportando gastos:", e);
    } finally {
      setExportingGastos(false);
    }
  };

  // ─── Export: Inventario ──────────────────────────────────────
  const exportInventario = async () => {
    setExportingInventario(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("name, brands(name), stock, cost_price, price")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const headers = ["Nombre", "Marca", "Stock", "Costo Unitario COP", "Valor Total COP"];
      const rows = (data || []).map((p: any) => {
        const cost = p.cost_price ?? 0;
        const total = cost * (p.stock ?? 0);
        return [
          p.name || "",
          p.brands?.name || "Sin marca",
          String(p.stock ?? 0),
          String(cost),
          String(total),
        ];
      });

      downloadCsv(`inventario_${new Date().toISOString().split("T")[0]}.csv`, [
        headers,
        ...rows,
      ]);
    } catch (e) {
      console.error("Error exportando inventario:", e);
    } finally {
      setExportingInventario(false);
    }
  };

  // ─── KPIs derivados ─────────────────────────────────────────
  const kpis = stats
    ? [
        {
          label: "Ingresos",
          value: stats.revenue,
          icon: TrendingUp,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
        },
        {
          label: "Gastos",
          value: stats.expenses,
          icon: TrendingDown,
          color: "text-rose-500",
          bg: "bg-rose-50",
          border: "border-rose-100",
        },
        {
          label: "Utilidad Bruta",
          value: stats.gross_profit,
          icon: DollarSign,
          color: "text-gold",
          bg: "bg-amber-50",
          border: "border-amber-100",
        },
        {
          label: "Utilidad Neta",
          value: stats.net_profit,
          icon: DollarSign,
          color: stats.net_profit >= 0 ? "text-emerald-500" : "text-rose-500",
          bg: stats.net_profit >= 0 ? "bg-emerald-50" : "bg-rose-50",
          border: stats.net_profit >= 0 ? "border-emerald-100" : "border-rose-100",
        },
      ]
    : [];

  const EXPORT_BUTTONS = [
    {
      label: "Ingresos",
      sublabel: "Órdenes pagadas / enviadas",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
      loading: exportingIngresos,
      action: exportIngresos,
      filename: `ingresos_${dateRange.from}_${dateRange.to}.csv`,
    },
    {
      label: "Gastos",
      sublabel: "Todos los gastos del período",
      icon: Receipt,
      color: "text-rose-600",
      bg: "bg-rose-50 hover:bg-rose-100 border-rose-200",
      loading: exportingGastos,
      action: exportGastos,
      filename: `gastos_${dateRange.from}_${dateRange.to}.csv`,
    },
    {
      label: "Inventario",
      sublabel: "Productos activos con costo",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      loading: exportingInventario,
      action: exportInventario,
      filename: `inventario_${new Date().toISOString().split("T")[0]}.csv`,
    },
  ];

  const periodLabel =
    period === "hoy"
      ? "Hoy"
      : period === "semana"
      ? "Últimos 7 días"
      : period === "mes"
      ? "Este mes"
      : period === "ano"
      ? "Este año"
      : `${dateRange.from} – ${dateRange.to}`;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Reportes</h1>
          <p className="font-body text-sm text-charcoal-muted">
            Exporta y analiza los datos financieros del período seleccionado
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
            <Calendar className="w-4 h-4 text-charcoal-muted shrink-0" />
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => {
                setPeriod("custom");
                setCustomRange((prev) => ({ ...prev, from: e.target.value }));
              }}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
            <span className="text-charcoal-muted text-sm">a</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => {
                setPeriod("custom");
                setCustomRange((prev) => ({ ...prev, to: e.target.value }));
              }}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-border rounded-2xl animate-pulse" />
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className={`relative bg-white border ${kpi.border} shadow-sm rounded-2xl p-5 overflow-hidden`}
                >
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <p className="font-display text-2xl text-charcoal font-semibold mb-0.5">
                    {formatCOP(kpi.value)}
                  </p>
                  <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest">
                    {kpi.label}
                  </p>
                </div>
              );
            })}
      </div>

      {/* ── Período activo ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-cream border border-border rounded-xl w-fit">
        <Calendar className="w-3.5 h-3.5 text-charcoal-muted" />
        <span className="font-body text-xs text-charcoal-muted">
          Período:{" "}
          <span className="font-semibold text-charcoal">{periodLabel}</span>
        </span>
      </div>

      {/* ── Export Cards ── */}
      <div>
        <h2 className="font-display text-xl text-charcoal mb-4">Exportar Datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXPORT_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            return (
              <div
                key={btn.label}
                className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${btn.bg} border flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${btn.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base text-charcoal">{btn.label}</p>
                    <p className="font-body text-xs text-charcoal-muted mt-0.5">{btn.sublabel}</p>
                  </div>
                </div>

                <div className="bg-cream/50 border border-border/50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
                  <span className="font-mono text-[11px] text-charcoal-muted truncate">{btn.filename}</span>
                </div>

                <button
                  onClick={btn.action}
                  disabled={btn.loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-body text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${btn.bg} ${btn.color}`}
                >
                  {btn.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {btn.loading ? "Generando..." : "Descargar CSV"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Utilidad Neta Banner ── */}
      {stats && !statsLoading && (
        <div
          className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            stats.net_profit >= 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200"
          }`}
        >
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-1">
              Resultado del período
            </p>
            <p
              className={`font-display text-3xl font-semibold ${
                stats.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {stats.net_profit >= 0 ? "+" : ""}
              {formatCOP(stats.net_profit)}
            </p>
            <p className="font-body text-xs text-charcoal-muted mt-1">
              Ingresos {formatCOP(stats.revenue)} — Gastos {formatCOP(stats.expenses)} — Costo ventas{" "}
              {formatCOP(stats.cost)}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              stats.net_profit >= 0 ? "bg-emerald-100" : "bg-rose-100"
            }`}
          >
            {stats.net_profit >= 0 ? (
              <TrendingUp className="w-7 h-7 text-emerald-600" />
            ) : (
              <TrendingDown className="w-7 h-7 text-rose-600" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
