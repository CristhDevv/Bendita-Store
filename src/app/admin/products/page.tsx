"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category, Brand } from "@/types";
import toast from "react-hot-toast";
import NextImage from "next/image";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Products Admin Page ───────────────────────────────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: p } = await supabase
      .from("products")
      .select("*, category:categories(name), brand:brands(name)")
      .order("created_at", { ascending: false });
    setProducts((p as Product[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto permanentemente?")) return;
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    } catch { toast.error("Error al eliminar"); }
    finally { setDeletingId(null); }
  };

  const handleToggleActive = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (!error) { setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p)); }
  };

  const handleToggleFeatured = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ is_featured: !product.is_featured }).eq("id", product.id);
    if (!error) { setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p)); }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand as Brand | undefined)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Productos</h1>
          <p className="font-body text-sm text-charcoal-muted">{products.length} productos en total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm"
          placeholder="Buscar por nombre, marca o slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-cream/30">
                  {[
                    { label: "Producto", cls: "text-left w-auto" },
                    { label: "Marca", cls: "text-left w-28" },
                    { label: "Precio", cls: "text-left w-28 whitespace-nowrap" },
                    { label: "Stock", cls: "text-left w-16" },
                    { label: "Estado", cls: "text-left w-24" },
                    { label: "", cls: "text-right w-24" },
                  ].map((h) => (
                    <th key={h.label} className={`px-4 py-3 font-body text-xs uppercase tracking-widest text-charcoal-muted ${h.cls}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border hover:bg-cream/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cream border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                          {product.images?.[0] ? (
                            <NextImage src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-charcoal-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm text-charcoal font-medium truncate max-w-[180px]">{product.name}</p>
                          <p className="font-body text-xs text-charcoal-muted uppercase">{product.concentration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal-muted truncate max-w-[100px]">
                      {(product.brand as Brand | undefined)?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-display text-sm text-charcoal font-semibold">{formatCOP(product.price)}</p>
                      {product.compare_price && (
                        <p className="font-body text-xs text-charcoal-muted line-through">{formatCOP(product.compare_price)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-xs px-2 py-0.5 rounded-lg ${product.stock > 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-body ${product.is_active ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-charcoal-muted border-border bg-cream"}`}>
                          {product.is_active ? "Activo" : "Inactivo"}
                        </span>
                        {product.is_featured && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border text-gold border-gold/20 bg-gold/5 font-body">⭐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleFeatured(product)} className="w-7 h-7 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-gold transition-colors" title={product.is_featured ? "Quitar destacado" : "Destacar"}>
                          {product.is_featured ? <Star className="w-3.5 h-3.5" /> : <StarOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleToggleActive(product)} className="w-7 h-7 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors" title={product.is_active ? "Desactivar" : "Activar"}>
                          {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <Link href={`/admin/products/${product.id}/edit`} className="w-7 h-7 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-charcoal-muted hover:text-red-500 transition-colors disabled:opacity-40">
                          {deletingId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Package className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">Sin resultados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
