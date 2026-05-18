"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted/40";
const selectClass = `${inputClass} cursor-pointer`;

interface Product {
  id: string;
  name: string;
  stock: number;
}

export default function MovimientoPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    product_id: "",
    type: "entrada" as "entrada" | "salida" | "ajuste",
    quantity: "",
    cost_price: "",
    notes: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, stock")
        .order("name");
      if (data) setProducts(data as Product[]);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity) return;

    setSaving(true);
    const supabase = createClient();
    const product = products.find(p => p.id === form.product_id);
    if (!product) {
      setSaving(false);
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error("Cantidad inválida");
      setSaving(false);
      return;
    }

    let logQty = qty;
    let newStock = product.stock;

    if (form.type === "entrada") {
      newStock += Math.abs(qty);
      logQty = Math.abs(qty);
    } else if (form.type === "salida") {
      newStock -= Math.abs(qty);
      newStock = Math.max(0, newStock);
      logQty = -Math.abs(qty);
    } else {
      newStock += qty;
      logQty = qty;
    }

    try {
      // 1. Actualizar producto
      const updates: any = { stock: newStock };
      if (form.cost_price) updates.cost_price = parseFloat(form.cost_price);

      const { error: pError } = await supabase.from("products").update(updates).eq("id", product.id);
      if (pError) throw pError;

      // 2. Registrar movimiento
      const { error: lError } = await supabase.from("inventory_logs").insert([{
        product_id: product.id,
        type: form.type,
        quantity: logQty,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        notes: form.notes || null
      }]);
      if (lError) throw lError;

      toast.success("Movimiento registrado exitosamente");
      router.push("/admin/accounting/inventario");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar movimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-xl mx-auto">
      <Link href="/admin/accounting/inventario" className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al Inventario
      </Link>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="font-display text-2xl text-charcoal mb-6">Registrar Movimiento</h1>
        
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Producto *</label>
              <SearchableSelect
                options={products.map((p) => ({ value: p.id, label: `${p.name} (St: ${p.stock})` }))}
                value={form.product_id}
                onChange={(value) => setForm({ ...form, product_id: value })}
                placeholder="Busca y selecciona un producto..."
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Tipo de Operación *</label>
                <SearchableSelect
                  options={[{value: "entrada", label: "Entrada"}, {value: "salida", label: "Salida"}, {value: "ajuste", label: "Ajuste Manual"}]}
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v as "entrada" | "salida" | "ajuste" })}
                  placeholder="Selecciona tipo"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Cantidad *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  className={inputClass}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Costo Unitario (Opcional)</label>
              <input
                type="number"
                placeholder="Actualizar costo (ej: 45000)"
                className={inputClass}
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                disabled={saving}
              />
              <p className="text-[10px] text-charcoal-muted mt-1 ml-1">Si dejas esto en blanco, se mantiene el costo anterior.</p>
            </div>

            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Notas / Referencia</label>
              <textarea
                placeholder="Factura, lote, motivo..."
                rows={2}
                className={`${inputClass} resize-none`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/admin/accounting/inventario" className="flex-1 py-3 rounded-xl bg-cream border border-border font-body text-sm text-charcoal-muted hover:text-charcoal transition-colors shadow-sm text-center flex items-center justify-center">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-charcoal hover:bg-gold text-white font-body font-semibold text-sm transition-all shadow-sm disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
