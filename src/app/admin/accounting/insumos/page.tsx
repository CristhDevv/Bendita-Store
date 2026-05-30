"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SupplyCategory {
  id: string;
  name: string;
  created_at: string;
}

interface Supply {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  quantity: number;
  cost: number;
  notes: string | null;
  created_at: string;
  category?: SupplyCategory | null;
}

const UNIT_OPTIONS = ["ml", "g", "kg", "l", "oz", "unidad", "pares", "metros"];

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function InsumosPage() {
  const supabase = createClient();

  // Data States
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  // Supply Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("ml");
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formCost, setFormCost] = useState<number>(0);
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: catsData }, { data: suppliesData }] = await Promise.all([
        supabase.from("supply_categories").select("*").order("name"),
        supabase.from("supplies").select("*, category:supply_categories(*)").order("created_at", { ascending: false }),
      ]);
      setCategories(catsData || []);
      setSupplies(suppliesData || []);
    } catch (e) {
      console.error("Error cargando insumos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || catLoading) return;
    setCatLoading(true);
    try {
      const { data, error } = await supabase
        .from("supply_categories")
        .insert([{ name: newCatName.trim() }])
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName("");
    } catch (err) {
      console.error("Error creando categoría:", err);
    } finally {
      setCatLoading(false);
    }
  };

  // Supply Create/Edit Submit
  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formLoading) return;
    setFormLoading(true);

    const payload = {
      name: formName.trim(),
      category_id: formCategory || null,
      unit: formUnit,
      quantity: Number(formQuantity) || 0,
      cost: Number(formCost) || 0,
      notes: formNotes.trim() || null,
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from("supplies")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("supplies")
          .insert([payload]);
        if (error) throw error;
      }
      resetSupplyForm();
      await fetchData();
    } catch (err) {
      console.error("Error guardando insumo:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (supply: Supply) => {
    setEditId(supply.id);
    setFormName(supply.name);
    setFormCategory(supply.category_id || "");
    setFormUnit(supply.unit);
    setFormQuantity(supply.quantity);
    setFormCost(supply.cost);
    setFormNotes(supply.notes || "");
  };

  const resetSupplyForm = () => {
    setEditId(null);
    setFormName("");
    setFormCategory("");
    setFormUnit("ml");
    setFormQuantity(0);
    setFormCost(0);
    setFormNotes("");
  };

  // Supply Delete
  const handleDeleteSupply = async (id: string) => {
    try {
      const { error } = await supabase.from("supplies").delete().eq("id", id);
      if (error) throw error;
      setSupplies((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error eliminando insumo:", err);
    }
  };

  // Filter supplies
  const filteredSupplies = supplies.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Live Unit Cost calculation
  const calculatedUnitCost = formQuantity > 0 ? formCost / formQuantity : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Insumos</h1>
        <p className="font-body text-sm text-charcoal-muted">
          Administración y control de materias primas e insumos de producción
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns - Form & Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* Create Category Section */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="w-5 h-5 text-gold" />
              <h2 className="font-display text-lg text-charcoal">Nueva Categoría</h2>
            </div>
            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej. Envases, Esencias..."
                className="flex-1 px-4 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                required
              />
              <button
                type="submit"
                disabled={catLoading || !newCatName.trim()}
                className="px-4 py-2 bg-charcoal text-white rounded-xl font-body text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-50"
              >
                {catLoading ? "..." : <Plus className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Create/Edit Supply Section */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-charcoal">
                {editId ? "Editar Insumo" : "Nuevo Insumo"}
              </h2>
              {editId && (
                <button
                  onClick={resetSupplyForm}
                  className="font-body text-xs text-charcoal-muted hover:text-charcoal underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSupplySubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Alcohol Deodorizado, Esencia de Rosas..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                  >
                    <option value="">Selecciona...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                    Unidad de Medida
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                    Cantidad Total
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                    Costo Total (COP)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                    required
                  />
                </div>
              </div>

              {/* Dynamic cost per unit calculation */}
              <div className="bg-cream/40 border border-border rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-charcoal-muted">
                  <Info className="w-3.5 h-3.5" />
                  <span className="font-body text-xs font-semibold">Costo por {formUnit}:</span>
                </div>
                <span className="font-display text-sm font-bold text-gold">
                  {formatCOP(calculatedUnitCost)}
                </span>
              </div>

              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                  Notas / Observaciones
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej. Calidad premium, proveedor alternativo..."
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-charcoal text-white rounded-xl font-body text-sm font-bold hover:bg-gold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editId ? "Actualizar Insumo" : "Registrar Insumo"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Insumos List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl text-charcoal">Inventario de Insumos</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-charcoal-muted" />
                <input
                  type="text"
                  placeholder="Buscar insumo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/20 focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredSupplies.length === 0 ? (
              <div className="text-center py-12 bg-cream/20 border border-dashed border-border rounded-2xl">
                <p className="font-body text-sm text-charcoal-muted">No se encontraron insumos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredSupplies.map((supply) => {
                  const unitCost = supply.quantity > 0 ? supply.cost / supply.quantity : 0;
                  const isDeleting = confirmDeleteId === supply.id;

                  return (
                    <div
                      key={supply.id}
                      className="border border-border rounded-xl p-4 hover:border-gold/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-body text-sm font-semibold text-charcoal truncate">
                            {supply.name}
                          </h3>
                          {supply.category && (
                            <span className="px-2 py-0.5 rounded bg-cream border border-border text-charcoal-muted text-[10px] uppercase font-semibold">
                              {supply.category.name}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-charcoal-muted">
                          Cantidad: <span className="font-semibold text-charcoal">{supply.quantity} {supply.unit}</span> · Costo total: <span className="font-semibold text-charcoal">{formatCOP(supply.cost)}</span>
                        </p>
                        {supply.notes && (
                          <p className="font-body text-[11px] text-charcoal-muted italic truncate">
                            Nota: {supply.notes}
                          </p>
                        )}
                      </div>

                      {/* Math & Actions */}
                      <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between md:justify-end">
                        <div className="text-right">
                          <p className="font-body text-[10px] text-charcoal-muted">Costo por {supply.unit}</p>
                          <p className="font-display text-sm font-bold text-gold">{formatCOP(unitCost)}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isDeleting ? (
                            <>
                              <button
                                onClick={() => handleEditClick(supply)}
                                className="w-8 h-8 rounded-lg hover:bg-cream border border-border flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(supply.id)}
                                className="w-8 h-8 rounded-lg hover:bg-rose-50 border border-border flex items-center justify-center text-charcoal-muted hover:text-rose-600 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 rounded-lg p-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              <button
                                onClick={() => handleDeleteSupply(supply.id)}
                                className="px-2.5 py-1 rounded bg-rose-500 text-white font-body text-[10px] font-semibold hover:bg-rose-600 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded bg-white border border-border font-body text-[10px] text-charcoal-muted hover:text-charcoal transition-colors"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
