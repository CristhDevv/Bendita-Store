"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
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
import type { OlfactiveFamily } from "@/types";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted/40";

const emptyForm = { name: "", slug: "" };

export default function AdminOlfactiveFamiliesPage() {
  const [families, setFamilies] = useState<OlfactiveFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchFamilies = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("olfactive_families")
      .select("*")
      .order("name");
    if (!error) setFamilies((data as OlfactiveFamily[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (fam: OlfactiveFamily) => {
    setEditingId(fam.id);
    setForm({
      name: fam.name,
      slug: fam.slug,
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
    };
    try {
      if (editingId) {
        const { error } = await supabase.from("olfactive_families").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Familia actualizada");
      } else {
        const { error } = await supabase.from("olfactive_families").insert(payload);
        if (error) throw error;
        toast.success("Familia creada");
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchFamilies();
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
      const { error } = await supabase.from("olfactive_families").delete().eq("id", id);
      if (error) throw error;
      setFamilies((prev) => prev.filter((f) => f.id !== id));
      toast.success("Familia eliminada");
    } catch { toast.error("Error al eliminar. Asegúrate de que no esté en uso."); }
    finally { 
      setDeletingId(null); 
      setConfirmId(null);
    }
  };

  const filtered = families.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Familias Olfativas</h1>
          <p className="font-body text-sm text-charcoal-muted">{families.length} familias en total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva Familia
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
                {editingId ? "Editar Familia" : "Nueva Familia"}
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
                  placeholder="Ej: Amaderado"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1.5">Slug *</label>
                <input
                  className={inputClass}
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="ej-amaderado"
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
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Familia"}
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
          placeholder="Buscar por nombre o slug..."
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
            {filtered.map((fam, i) => (
              <motion.div
                key={fam.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-cream/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-charcoal font-medium truncate">{fam.name}</p>
                  <div className="mt-0.5">
                    <span className="font-mono text-[10px] text-charcoal-muted bg-cream px-1.5 py-0.5 rounded-md border border-border">
                      {fam.slug}
                    </span>
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => openEdit(fam)}
                    className="w-8 h-8 rounded-lg hover:bg-cream-dark flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmId === fam.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleDelete(fam.id, fam.name)} disabled={deletingId === fam.id} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-body transition-colors disabled:opacity-50">
                        {deletingId === fam.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmId(null)} disabled={deletingId === fam.id} className="bg-cream hover:bg-border border border-border rounded-lg px-2.5 py-1.5 text-charcoal text-xs font-body transition-colors disabled:opacity-50">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(fam.id)}
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
                <Droplets className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">Sin familias olfativas</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
