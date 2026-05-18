"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Image as ImageIcon,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import toast from "react-hot-toast";
import NextImage from "next/image";

// --- Tipos ---
interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  stock: number;
  cost_price: number | null;
  price: number;
  compare_price: number | null;
  concentration: string | null;
  is_active: boolean;
  is_featured: boolean;
  stock_alert_threshold: number | null;
  brands?: { name: string } | null;
}

interface InventoryLog {
  id: string;
  product_id: string;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  notes: string | null;
  created_at: string;
  products?: { name: string } | null;
}

type FilterState = "Todos" | "Agotado" | "Crítico" | "Sin costo";

// --- Helpers ---
function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Componente Principal ---
export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<FilterState>("Todos");

  // Estado para eliminar
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  // --- Data Fetching ---
  const fetchInventory = async () => {
    setLoading(true);

    const { data: pData } = await supabase
      .from("products")
      .select("id, name, slug, images, stock, cost_price, price, compare_price, concentration, is_active, is_featured, stock_alert_threshold, brands(name)")
      .order("name");

    const { data: lData } = await supabase
      .from("inventory_logs")
      .select("id, type, quantity, created_at, notes, products(name)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (pData) setProducts(pData as Product[]);
    if (lData) setLogs(lData as InventoryLog[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- Acciones de Producto ---
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    } catch { 
      toast.error("Error al eliminar"); 
    } finally { 
      setDeletingId(null); 
      setConfirmId(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (!error) { setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p)); }
  };

  const handleToggleFeatured = async (product: Product) => {
    const { error } = await supabase.from("products").update({ is_featured: !product.is_featured }).eq("id", product.id);
    if (!error) { setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p)); }
  };

  // --- Inline Edits ---
  const updateStockInline = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));

    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
    if (!error) {
      await supabase.from("inventory_logs").insert([{
        product_id: id,
        type: "ajuste",
        quantity: delta,
        notes: "Ajuste manual rápido",
      }]);
      fetchInventory();
    }
  };

  const updateCostPriceInline = async (id: string, value: string) => {
    const val = value ? parseFloat(value) : null;
    await supabase.from("products").update({ cost_price: val }).eq("id", id);
    fetchInventory();
  };

  // --- Cálculos y Derivados ---
  const kpis = useMemo(() => {
    let totalValue = 0;
    let outOfStock = 0;
    let critical = 0;
    let noCost = 0;

    products.forEach((p) => {
      const threshold = p.stock_alert_threshold ?? 5;
      if (p.cost_price) totalValue += p.stock * p.cost_price;
      if (p.stock === 0) outOfStock++;
      if (p.stock > 0 && p.stock <= threshold) critical++;
      if (p.cost_price === null) noCost++;
    });

    return { totalValue, outOfStock, critical, noCost };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brands?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      const threshold = p.stock_alert_threshold ?? 5;
      if (filterState === "Agotado") matchesFilter = p.stock === 0;
      if (filterState === "Crítico") matchesFilter = p.stock > 0 && p.stock <= threshold;
      if (filterState === "Sin costo") matchesFilter = p.cost_price === null;

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, filterState]);

  return (
    <div className="pb-24 max-w-full">
      {/* HEADER: Título + KPIs + Botón Nuevo Producto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 bg-white border border-border p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="font-display text-xl text-charcoal">Inventario</h1>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal hover:bg-gold text-white font-body text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Nuevo Producto
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-charcoal-muted">Valor Total</span>
            <span className="text-sm font-mono font-semibold text-emerald-600">{formatCOP(kpis.totalValue)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-charcoal-muted">Agotados</span>
            <span className="text-sm font-mono font-semibold text-rose-600">{kpis.outOfStock}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-charcoal-muted">Críticos</span>
            <span className="text-sm font-mono font-semibold text-amber-500">{kpis.critical}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-charcoal-muted">Sin Costo</span>
            <span className="text-sm font-mono font-semibold text-blue-500">{kpis.noCost}</span>
          </div>
        </div>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Buscar producto o marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-border rounded-lg font-body text-xs outline-none focus:border-gold transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center flex-wrap gap-1 w-full sm:w-auto">
          {(["Todos", "Agotado", "Crítico", "Sin costo"] as FilterState[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterState(f)}
              className={`px-2.5 py-1.5 text-[10px] uppercase tracking-widest rounded-lg border transition-colors ${
                filterState === f
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-charcoal-muted border-border hover:bg-cream"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white border border-border rounded-2xl p-4 animate-pulse flex flex-col justify-between">
              <div className="w-full aspect-video bg-border rounded-xl mb-4" />
              <div>
                <div className="h-6 bg-border rounded w-3/4 mb-2" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredProducts.map((product) => {
              const threshold = product.stock_alert_threshold ?? 5;
              const isZero = product.stock === 0;
              const isCritical = product.stock > 0 && product.stock <= threshold;

              return (
                <div
                  key={product.id}
                  className="bg-white border border-border shadow-sm rounded-2xl p-4 flex flex-col"
                >
                  {/* Image & Quick Actions */}
                  <div className="w-full aspect-video relative rounded-xl overflow-hidden mb-4 bg-cream border border-border flex items-center justify-center shrink-0">
                    {product.images?.[0] ? (
                      <NextImage src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-charcoal-muted/30" />
                    )}
                    
                    {/* Quick Actions overlay */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => handleToggleFeatured(product)}
                        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm flex items-center justify-center text-charcoal-muted hover:text-gold transition-colors"
                        title={product.is_featured ? "Quitar destacado" : "Destacar"}
                      >
                        {product.is_featured ? <Star className="w-4 h-4 text-gold" fill="currentColor" /> : <StarOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
                        title={product.is_active ? "Desactivar" : "Activar"}
                      >
                        {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-charcoal line-clamp-1 mb-1" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="font-body text-xs text-charcoal-muted uppercase mb-3">
                      {product.brands?.name || "Sin marca"} {product.concentration ? `• ${product.concentration}` : ''}
                    </p>
                    
                    <div className="flex items-baseline mb-4">
                      <span className="font-display text-xl text-charcoal font-semibold">
                        {formatCOP(product.price)}
                      </span>
                      {product.compare_price && (
                        <span className="text-xs line-through text-charcoal-muted ml-2">
                          {formatCOP(product.compare_price)}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider border flex items-center gap-1.5 ${
                        isZero ? "bg-rose-50 border-rose-200 text-rose-600" : isCritical ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isZero ? "bg-rose-500" : isCritical ? "bg-amber-400" : "bg-emerald-500"}`} />
                        Stock: {product.stock}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider border ${
                        product.is_active 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </span>
                      {product.is_featured && (
                        <span className="bg-gold/10 text-gold border border-gold/20 rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider">
                          Destacado
                        </span>
                      )}
                      {product.cost_price === null && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider">
                          Sin Costo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Controls & Cost Input (Inline) */}
                  <div className="flex flex-col gap-2 mb-4 bg-cream/30 p-2.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-body text-charcoal-muted">Stock</span>
                      <div className="flex items-center gap-0.5 bg-white rounded-lg p-0.5 border border-border/50 shadow-sm">
                        <button onClick={() => updateStockInline(product.id, product.stock, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-rose-50 hover:text-rose-500 text-charcoal-muted transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs w-8 text-center font-medium text-charcoal">{product.stock}</span>
                        <button onClick={() => updateStockInline(product.id, product.stock, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-50 hover:text-emerald-500 text-charcoal-muted transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-body text-charcoal-muted">Costo Ud.</span>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-charcoal-muted">$</span>
                        <input 
                          type="number" 
                          defaultValue={product.cost_price || ""} 
                          onBlur={(e) => updateCostPriceInline(product.id, e.target.value)}
                          placeholder="0"
                          className={`w-full pl-5 pr-2 py-1 text-xs bg-white border outline-none transition-colors rounded-md text-right font-mono shadow-sm ${product.cost_price === null ? 'border-rose-300 focus:border-rose-500 text-rose-600' : 'border-border focus:border-gold text-charcoal'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/admin/accounting/inventario/${product.id}/edit`}
                      className="flex-1 bg-charcoal hover:bg-gold text-white rounded-xl flex justify-center py-2 items-center gap-2 font-body text-sm transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Link>
                    {confirmId === product.id ? (
                      <div className="flex-1 flex gap-1 items-center justify-center">
                        <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-3 py-1.5 text-xs font-body transition-colors flex-1 disabled:opacity-50 flex items-center justify-center">
                          {deletingId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                        </button>
                        <button onClick={() => setConfirmId(null)} disabled={deletingId === product.id} className="bg-cream hover:bg-border border border-border rounded-xl px-3 py-1.5 text-charcoal text-xs font-body transition-colors flex-1 disabled:opacity-50">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(product.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl flex justify-center py-2 items-center gap-2 font-body text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 bg-white border border-border shadow-sm rounded-2xl text-center mb-8">
              <Pencil className="w-8 h-8 text-gold/20 mx-auto mb-2" />
              <p className="font-body text-sm text-charcoal-muted">No se encontraron productos.</p>
            </div>
          )}
        </>
      )}

      {/* MOVIMIENTOS RECIENTES COMPACTOS */}
      <div className="bg-white border border-border rounded-xl shadow-sm p-4">
        <h2 className="font-display text-sm text-charcoal mb-3">Movimientos Recientes</h2>
        <div className="flex flex-col divide-y divide-border/50">
          {loading && logs.length === 0 ? (
            <div className="py-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin text-gold mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-4 text-xs text-charcoal-muted">No hay movimientos registrados.</div>
          ) : (
            logs.map((log) => {
              const isEntrada = log.type === "entrada" || (log.type === "ajuste" && log.quantity > 0);
              const isSalida = log.type === "salida" || (log.type === "ajuste" && log.quantity < 0);
              return (
                <div key={log.id} className="flex items-center gap-2 py-2 text-xs">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isEntrada ? "bg-emerald-500" : isSalida ? "bg-rose-500" : "bg-blue-500"
                    }`}
                  />
                  <span className="font-mono text-[10px] text-charcoal-muted w-14 shrink-0">
                    {formatDate(log.created_at).split(",")[0]}
                  </span>
                  <span className="font-body font-medium text-charcoal flex-1 min-w-0 truncate">
                    {log.products?.name}
                  </span>
                  <span
                    className={`font-mono font-medium text-right shrink-0 ${
                      log.quantity > 0
                        ? "text-emerald-500"
                        : log.quantity < 0
                        ? "text-rose-500"
                        : "text-charcoal-muted"
                    }`}
                  >
                    {log.quantity > 0 ? "+" : ""}
                    {log.quantity}
                  </span>
                  <span className="text-[9px] text-charcoal-muted uppercase tracking-widest w-12 text-right shrink-0">
                    {log.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB NAVEGACIÓN */}
      <Link
        href="/admin/accounting/inventario/movimiento"
        className="fixed bottom-6 right-6 z-40 bg-charcoal text-white rounded-full px-4 py-3 shadow-xl shadow-charcoal/20 hover:bg-gold hover:shadow-gold/20 transition-all hover:-translate-y-1 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="font-body text-sm font-medium">Movimiento</span>
      </Link>
    </div>
  );
}
