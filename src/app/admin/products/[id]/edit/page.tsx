"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

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
            <button type="button" onClick={() => onChange(notes.filter((x) => x !== n))} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"><X className="w-2.5 h-2.5" /></button>
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

function FamilySelector({ options, selected, onChange }: { options: OlfactiveFamily[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {options.map((f) => {
        const isSelected = selected.includes(f.name);
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              if (isSelected) onChange(selected.filter(s => s !== f.name));
              else onChange([...selected, f.name]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-body transition-colors border ${
              isSelected 
                ? "bg-charcoal text-white border-charcoal" 
                : "bg-cream text-charcoal-muted border-border hover:border-charcoal hover:text-charcoal"
            }`}
          >
            {f.name}
          </button>
        )
      })}
    </div>
  );
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [families, setFamilies] = useState<OlfactiveFamily[]>([]);
  const [notes, setNotes] = useState({ top: [] as string[], heart: [] as string[], base: [] as string[] });
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: 0, wholesale_price: 0, compare_price: 0,
    category_id: "", brand_id: "", gender: "unisex" as "women" | "men" | "unisex",
    concentration: "edp" as "parfum" | "edp" | "edt" | "edc" | "splash",
    stock: 0, olfactive_family: [] as string[], is_featured: false, is_active: true, images: "",
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("products").select("*, category:categories(*), brand:brands(*)").eq("id", id).single(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("olfactive_families").select("*").order("name"),
    ]).then(([{ data: p }, { data: c }, { data: b }, { data: f }]) => {
      if (p) {
        const product = p as Product;
        setForm({
          name: product.name || "",
          slug: product.slug || "",
          description: product.description || "",
          price: product.price || 0,
          wholesale_price: product.wholesale_price || 0,
          compare_price: product.compare_price || 0,
          category_id: product.category_id || "",
          brand_id: product.brand_id || "",
          gender: product.gender || "unisex",
          concentration: product.concentration || "edp",
          stock: product.stock || 0,
          olfactive_family: product.olfactive_family || [],
          is_featured: product.is_featured || false,
          is_active: product.is_active !== false,
          images: (product.images || []).join("\n"),
        });
        setNotes({ top: product.notes_top || [], heart: product.notes_heart || [], base: product.notes_base || [] });
      }
      setCategories((c as Category[]) || []);
      setBrands((b as Brand[]) || []);
      setFamilies((f as OlfactiveFamily[]) || []);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      price: Number(form.price),
      wholesale_price: Number(form.wholesale_price) || null,
      compare_price: Number(form.compare_price) || null,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      olfactive_family: form.olfactive_family.length > 0 ? form.olfactive_family : null,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      notes_top: notes.top, notes_heart: notes.heart, notes_base: notes.base,
    };
    try {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw error;
      toast.success("Producto actualizado");
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-32 bg-cream rounded-lg animate-pulse" />
        <div className="h-96 bg-cream rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a Productos
      </Link>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="font-display text-2xl text-charcoal mb-6">Editar Producto</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Nombre *</label>
              <input className={inputClass} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" />
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
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio COP *</label><input className={inputClass} type="number" required min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio Mayorista</label><input className={inputClass} type="number" min={0} value={form.wholesale_price} onChange={(e) => setForm((f) => ({ ...f, wholesale_price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio comparar</label><input className={inputClass} type="number" min={0} value={form.compare_price} onChange={(e) => setForm((f) => ({ ...f, compare_price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Stock</label><input className={inputClass} type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Categoría</label><SearchableSelect options={[{value: "", label: "Sin categoría"}, ...categories.map(c => ({value: c.id, label: c.name}))]} value={form.category_id} onChange={(v) => setForm((f) => ({ ...f, category_id: v }))} placeholder="Selecciona categoría" /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Marca</label><SearchableSelect options={[{value: "", label: "Sin marca"}, ...brands.map(b => ({value: b.id, label: b.name}))]} value={form.brand_id} onChange={(v) => setForm((f) => ({ ...f, brand_id: v }))} placeholder="Selecciona marca" /></div>
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">Familias Olfativas</label>
            <FamilySelector options={families} selected={form.olfactive_family} onChange={(v) => setForm(f => ({ ...f, olfactive_family: v }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Género</label><SearchableSelect options={[{value: "women", label: "Mujer"}, {value: "men", label: "Hombre"}, {value: "unisex", label: "Unisex"}]} value={form.gender} onChange={(v) => setForm((f) => ({ ...f, gender: v as "women" | "men" | "unisex" }))} placeholder="Selecciona género" /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Concentración</label><SearchableSelect options={[{value: "parfum", label: "Parfum"}, {value: "edp", label: "EDP"}, {value: "edt", label: "EDT"}, {value: "edc", label: "EDC"}, {value: "splash", label: "Splash"}]} value={form.concentration} onChange={(v) => setForm((f) => ({ ...f, concentration: v as "parfum" | "edp" | "edt" | "edc" | "splash" }))} placeholder="Selecciona concentración" /></div>
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
              {saving ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
