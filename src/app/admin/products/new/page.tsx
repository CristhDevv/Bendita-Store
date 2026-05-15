"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Brand } from "@/types";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted/40";
const selectClass = `${inputClass} cursor-pointer`;

function NotesSelector({ label, color, notes, onChange }: { label: string; color: string; notes: string[]; onChange: (notes: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (!v || notes.includes(v)) { setInput(""); return; } onChange([...notes, v]); setInput(""); };
  return (
    <div>
      <label className="block font-body text-xs text-charcoal-muted mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {notes.map((n) => (
          <span key={n} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-body border shadow-sm ${color}`}>
            {n}
            <button type="button" onClick={() => onChange(notes.filter((x) => x !== n))} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-xs outline-none transition-colors placeholder:text-charcoal-muted/40" placeholder="Agregar nota y presionar Enter" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl bg-white border border-border text-charcoal text-xs font-body hover:border-gold hover:text-gold transition-colors shadow-sm">+ Agregar</button>
      </div>
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [notes, setNotes] = useState({ top: [] as string[], heart: [] as string[], base: [] as string[] });
  const [form, setForm] = useState({
    name: "", slug: "", description: "", 
    price: "" as number | "", 
    compare_price: "" as number | "",
    category_id: "", brand_id: "", gender: "unisex" as "women" | "men" | "unisex",
    concentration: "edp" as "parfum" | "edp" | "edt" | "edc" | "splash",
    stock: "" as number | "", 
    is_featured: false, is_active: true, images: "",
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
    ]).then(([{ data: c }, { data: b }]) => {
      setCategories((c as Category[]) || []);
      setBrands((b as Brand[]) || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      price: Number(form.price),
      compare_price: Number(form.compare_price) || null,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      notes_top: notes.top, notes_heart: notes.heart, notes_base: notes.base,
    };
    try {
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
      toast.success("Producto creado");
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a Productos
      </Link>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="font-display text-2xl text-charcoal mb-6">Nuevo Producto</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Nombre *</label>
              <input className={inputClass} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} placeholder="Nombre del producto" />
            </div>
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Slug *</label>
              <input className={inputClass} required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="url-del-producto" />
            </div>
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">Descripción</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descripción del producto..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio COP *</label><input className={inputClass} type="number" required min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? "" : Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio comparar</label><input className={inputClass} type="number" min={0} value={form.compare_price} onChange={(e) => setForm((f) => ({ ...f, compare_price: e.target.value === "" ? "" : Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Stock</label><input className={inputClass} type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value === "" ? "" : Number(e.target.value) }))} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Categoría</label><select className={selectClass} value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}><option value="">Sin categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Marca</label><select className={selectClass} value={form.brand_id} onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))}><option value="">Sin marca</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Género</label><select className={selectClass} value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "women" | "men" | "unisex" }))}><option value="women">Mujer</option><option value="men">Hombre</option><option value="unisex">Unisex</option></select></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Concentración</label><select className={selectClass} value={form.concentration} onChange={(e) => setForm((f) => ({ ...f, concentration: e.target.value as "parfum" | "edp" | "edt" | "edc" | "splash" }))}><option value="parfum">Parfum</option><option value="edp">EDP</option><option value="edt">EDT</option><option value="edc">EDC</option><option value="splash">Splash</option></select></div>
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">URLs de Imágenes (una por línea)</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} placeholder={"https://ejemplo.com/imagen1.jpg\nhttps://ejemplo.com/imagen2.jpg"} />
          </div>
          <div className="space-y-3 pt-1">
            <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest">Pirámide Olfativa</p>
            <NotesSelector label="🌿 Notas de Salida (Top)" color="text-emerald-400 border-emerald-400/20 bg-emerald-400/5" notes={notes.top} onChange={(v) => setNotes((n) => ({ ...n, top: v }))} />
            <NotesSelector label="🌸 Notas de Corazón (Heart)" color="text-rose-400 border-rose-400/20 bg-rose-400/5" notes={notes.heart} onChange={(v) => setNotes((n) => ({ ...n, heart: v }))} />
            <NotesSelector label="🪵 Notas de Fondo (Base)" color="text-amber-400 border-amber-400/20 bg-amber-400/5" notes={notes.base} onChange={(v) => setNotes((n) => ({ ...n, base: v }))} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_active ? "bg-charcoal border-charcoal" : "border-border"}`} onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
                {form.is_active && <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4l3.5 3.5L11 1" /></svg>}
              </div>
              <span className="font-body text-sm text-charcoal-muted">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_featured ? "bg-gold border-gold" : "border-border"}`} onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}>
                {form.is_featured && <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4l3.5 3.5L11 1" /></svg>}
              </div>
              <span className="font-body text-sm text-charcoal-muted">Destacado</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/admin/products" className="flex-1 py-3 rounded-xl bg-cream border border-border font-body text-sm text-charcoal-muted hover:text-charcoal transition-colors shadow-sm text-center">Cancelar</Link>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-charcoal hover:bg-gold text-white font-body font-semibold text-sm transition-all shadow-sm disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
