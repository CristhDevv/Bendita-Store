"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted/40";

function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyForm = { name: "", slug: "", description: "", image_url: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (!error) setCategories((data as Category[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image_url: cat.image_url || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Categoría creada");
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoría eliminada");
    } catch { toast.error("Error al eliminar"); }
    finally { 
      setDeletingId(null); 
      setConfirmId(null);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Categorías</h1>
          <p className="font-body text-sm text-charcoal-muted">{categories.length} categorías en total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
      </div>

      {/* Inline Create/Edit Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key={editingId ?? "new"}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-border rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-charcoal">
                {editingId ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="w-8 h-8 rounded-lg bg-cream border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Nombre *</label>
                <input
                  className={inputClass}
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">
                  Slug
                  <span className="ml-2 text-[10px] font-normal text-charcoal-muted/60 normal-case tracking-normal">⚡ generado automáticamente</span>
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-cream/60 border border-border text-charcoal-muted font-body text-sm outline-none cursor-default select-all"
                  readOnly
                  value={form.slug}
                  placeholder="se genera desde el nombre"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Descripción</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descripción de la categoría..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">URL de Imagen</label>
                <input
                  className={inputClass}
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-xl bg-cream border border-border font-body text-sm text-charcoal-muted hover:text-charcoal transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-charcoal hover:bg-gold text-white font-body font-semibold text-sm transition-all shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Categoría"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm"
          placeholder="Buscar por nombre, slug o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col divide-y divide-border">
            {filtered.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-cream/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-body text-sm text-charcoal font-medium truncate">{cat.name}</p>
                    <span className="font-mono text-[10px] text-charcoal-muted bg-cream px-1.5 py-0.5 rounded-md border border-border shrink-0">
                      {cat.slug}
                    </span>
                  </div>
                  <p className="font-body text-xs text-charcoal-muted truncate">
                    {cat.description || "Sin descripción"}
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="w-8 h-8 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmId === cat.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleDelete(cat.id, cat.name)} disabled={deletingId === cat.id} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-body transition-colors disabled:opacity-50">
                        {deletingId === cat.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmId(null)} disabled={deletingId === cat.id} className="bg-cream hover:bg-border border border-border rounded-lg px-2.5 py-1.5 text-charcoal text-xs font-body transition-colors disabled:opacity-50">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(cat.id)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-charcoal-muted hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Layers className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">Sin categorías</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
