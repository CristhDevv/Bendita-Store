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
import type { Product, Brand } from "@/types";
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
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: p } = await supabase
      .from("products")
      .select("*, category:categories(name), brand:brands(name)")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });
    setProducts((p as Product[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("products").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Producto archivado");
    } catch { toast.error("Error al archivar"); }
    finally { 
      setDeletingId(null); 
      setConfirmId(null);
    }
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

      {/* Product Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
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
                    {(product.brand as Brand | undefined)?.name || "Sin marca"}
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
                    <span className="bg-cream border border-border text-charcoal-muted rounded-full px-2.5 py-0.5 text-[10px] font-body uppercase tracking-wider">
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
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
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
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 bg-white border border-border shadow-sm rounded-2xl text-center">
              <Package className="w-8 h-8 text-gold/20 mx-auto mb-2" />
              <p className="font-body text-sm text-charcoal-muted">Sin resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
