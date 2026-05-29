"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Filter, FileSpreadsheet, ArrowUpRight, DollarSign, Tag, TrendingUp, Info } from "lucide-react";
import { getPosSales, getPosStats } from "@/lib/supabase/pos";
import { formatPrice } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface PosSaleWithDetails {
  id: string;
  created_at: string;
  channel: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  order_id?: string | null;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    final_price: number;
  }[];
}

export function POSHistorial() {
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = new Date(new Date().setDate(1)).toISOString().split("T")[0];

  // State
  const [dateFrom, setDateFrom] = useState(firstDayOfMonthStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [channel, setChannel] = useState<string>("");
  const [sales, setSales] = useState<PosSaleWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Para que cubra todo el día hasta las 23:59:59 del dateTo
      const fromISO = new Date(`${dateFrom}T00:00:00`).toISOString();
      const toISO = new Date(`${dateTo}T23:59:59`).toISOString();

      const [historyData, statsData] = await Promise.all([
        getPosSales({ dateFrom: fromISO, dateTo: toISO, channel: channel || undefined }),
        getPosStats(fromISO, toISO),
      ]);

      setSales(historyData as PosSaleWithDetails[]);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, channel]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }

    const headers = [
      "ID Venta",
      "Fecha",
      "Cliente",
      "Canal",
      "Método de Pago",
      "Subtotal",
      "Descuento",
      "Total",
      "Items (Cantidad)",
      "Notas",
      "ID Orden Vinculada",
    ];

    const rows = sales.map((sale) => {
      const itemsFormatted = sale.items
        .map((i) => `${i.product_name} (x${i.quantity})`)
        .join(" | ");

      return [
        sale.id,
        new Date(sale.created_at).toLocaleString("es-CO"),
        sale.customer_name || "Anónimo",
        sale.channel,
        sale.payment_method,
        sale.subtotal,
        sale.discount,
        sale.total,
        `"${itemsFormatted}"`,
        `"${sale.notes || ""}"`,
        sale.order_id || "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historial_pos_${dateFrom}_al_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-8">
      {/* STATS OVERVIEW */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Total */}
          <div className="bg-white border border-border shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-charcoal">
                ${formatPrice(stats.grandTotal)}
              </p>
              <p className="font-body text-xs text-charcoal-muted">Total Recaudado ({stats.count} ventas)</p>
            </div>
          </div>

          {/* Card Channels */}
          <div className="bg-white border border-border shadow-sm rounded-2xl p-5">
            <h4 className="text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-2 font-semibold">
              Ventas por Canal
            </h4>
            <div className="space-y-1.5 font-body text-xs">
              {Object.entries(stats.byChannel || {}).map(([chan, total]) => (
                <div key={chan} className="flex justify-between items-center text-charcoal">
                  <span className="capitalize">{chan}</span>
                  <span className="font-semibold">${formatPrice(total as number)}</span>
                </div>
              ))}
              {Object.keys(stats.byChannel || {}).length === 0 && (
                <p className="text-charcoal-muted italic">Sin ventas en este período</p>
              )}
            </div>
          </div>

          {/* Card Payment Methods */}
          <div className="bg-white border border-border shadow-sm rounded-2xl p-5">
            <h4 className="text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-2 font-semibold">
              Ventas por Método de Pago
            </h4>
            <div className="space-y-1.5 font-body text-xs">
              {Object.entries(stats.byPaymentMethod || {}).map(([method, total]) => (
                <div key={method} className="flex justify-between items-center text-charcoal">
                  <span className="capitalize">{method}</span>
                  <span className="font-semibold">${formatPrice(total as number)}</span>
                </div>
              ))}
              {Object.keys(stats.byPaymentMethod || {}).length === 0 && (
                <p className="text-charcoal-muted italic">Sin ventas en este período</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-border shadow-sm rounded-2xl p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-body text-charcoal-muted mb-1.5 font-semibold">
              Desde
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-3.5 py-2 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-body text-charcoal-muted mb-1.5 font-semibold">
              Hasta
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-3.5 py-2 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-body text-charcoal-muted mb-1.5 font-semibold">
              Canal de Venta
            </label>
            <select
              className="w-full px-3.5 py-2 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body capitalize"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="">Todos los canales</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="efectivo">Físico / Local</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="py-2.5 px-5 bg-charcoal hover:bg-gold text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* SALES HISTORY TABLE */}
      <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-cream animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center">
            <Info className="w-12 h-12 text-cream-dark mx-auto mb-3 stroke-[1.2]" />
            <p className="font-display font-semibold text-charcoal">No se encontraron ventas</p>
            <p className="font-body text-xs text-charcoal-muted mt-1">
              Ajusta los filtros de fecha o canal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm divide-y divide-border">
              <thead className="bg-cream/40 text-charcoal-muted text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Fecha / Hora</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold text-center">Canal</th>
                  <th className="px-6 py-4 font-semibold text-center">Pago</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 text-center w-24">Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-cream/10 transition-colors">
                    <td className="px-6 py-4 text-charcoal font-medium whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-charcoal font-medium">
                        {sale.customer_name || <span className="text-charcoal-muted italic">Anónimo</span>}
                      </p>
                      {sale.customer_phone && (
                        <p className="text-[10px] text-charcoal-muted">{sale.customer_phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg bg-cream border border-border text-charcoal capitalize">
                        {sale.channel === "efectivo" ? "Físico" : sale.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border border-border text-charcoal-muted capitalize">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[240px] truncate text-xs text-charcoal-muted" title={sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(", ")}>
                        {sale.items.map((i) => `${i.product_name} (x${i.quantity})`).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-charcoal">
                      ${formatPrice(sale.total)}
                      {sale.discount > 0 && (
                        <p className="text-[9px] text-rose-500">Desc: -${formatPrice(sale.discount)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sale.order_id ? (
                        <a
                          href={`/admin/orders/${sale.order_id}`}
                          className="inline-flex items-center gap-1 text-xs text-gold hover:underline font-semibold"
                        >
                          Ver
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-charcoal-muted/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
