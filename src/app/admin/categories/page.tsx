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

const emptyForm = { name: "", slug: "", description: "", image_url: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    if (!confirm(`¿Eliminar "${name}" permanentemente?`)) return;
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoría eliminada");
    } catch { toast.error("Error al eliminar"); }
    finally { setDeletingId(null); }
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
      <AnimatePresence>
        {showForm && (
          <motion.div
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
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                  }))}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Slug *</label>
                <input
                  className={inputClass}
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="url-de-la-categoria"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-cream/30">
                  {["Nombre", "Slug", "Descripción", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-body text-xs uppercase tracking-widest text-charcoal-muted ${h === "" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat, i) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border hover:bg-cream/50 transition-colors last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-charcoal font-medium">{cat.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-charcoal-muted bg-cream px-2 py-0.5 rounded-lg border border-border">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-body text-xs text-charcoal-muted line-clamp-2">
                        {cat.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="w-7 h-7 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deletingId === cat.id}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-charcoal-muted hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          {deletingId === cat.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Layers className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">Sin categorías</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
