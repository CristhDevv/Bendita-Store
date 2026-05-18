"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  X,
  ArrowRight,
  Trash2,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

type Period = "hoy" | "semana" | "mes" | "ano" | "custom";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    notation: "standard",
  }).format(amount);
}

function formatDate(dateStr: string) {
  // Adjuntamos una hora neutra para que no aplique desplazamientos de zona horaria (UTC -> Local)
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function GastosPage() {
  const [period, setPeriod] = useState<Period>("mes");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Operacional",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const supabase = createClient();

  // Handle Period Change
  useEffect(() => {
    const today = new Date();
    let from = new Date();
    const to = today.toISOString().split("T")[0];

    switch (period) {
      case "hoy":
        from = today;
        break;
      case "semana":
        from.setDate(today.getDate() - 7);
        break;
      case "mes":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "ano":
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        return; // Usa los valores actuales de dateRange
    }
    setDateRange({ from: from.toISOString().split("T")[0], to });
  }, [period]);

  // Fetch Data
  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", dateRange.from)
      .lte("date", dateRange.to)
      .order("date", { ascending: false });
    
    if (!error && data) {
      setExpenses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    setIsSaving(true);
    const amountNum = parseFloat(newExpense.amount);
    
    const { error } = await supabase.from("expenses").insert([{
      category: newExpense.category,
      description: newExpense.description,
      amount: amountNum,
      date: newExpense.date,
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewExpense({ ...newExpense, description: "", amount: "" });
      fetchExpenses(); // Recargar tabla
    } else {
      alert("Error al guardar el gasto");
    }
    setIsSaving(false);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.")) return;
    
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      fetchExpenses(); // Recargar tabla
    } else {
      alert("Error al eliminar el gasto");
    }
  };

  const totalGastos = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal mb-1">Gastos</h1>
          <p className="font-body text-sm text-charcoal-muted">
            Registro y control de egresos de la tienda
          </p>
        </div>
        
        {/* Period Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {(["hoy", "semana", "mes", "ano"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl border text-sm font-body transition-colors ${
                period === p
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-charcoal border-border hover:bg-cream"
              }`}
            >
              {p === "hoy" ? "Hoy" : p === "semana" ? "Semana" : p === "mes" ? "Mes" : "Año"}
            </button>
          ))}
          
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-charcoal-muted" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => { setPeriod("custom"); setDateRange(prev => ({ ...prev, from: e.target.value }))}}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
            <span className="text-charcoal-muted">a</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => { setPeriod("custom"); setDateRange(prev => ({ ...prev, to: e.target.value }))}}
              className="text-sm font-body text-charcoal outline-none bg-transparent"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-xl font-body text-sm hover:bg-gold transition-colors ml-auto md:ml-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Gasto
          </button>
        </div>
      </div>

      {/* Listado de Gastos */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {loading ? (
          <div className="bg-white border border-border shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-charcoal-muted">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <span className="font-body text-sm">Cargando gastos...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white border border-border shadow-sm rounded-2xl p-8 text-center text-charcoal-muted font-body text-sm">
            No hay gastos registrados en este período.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((exp) => (
              <div key={exp.id} className="bg-white border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:border-gold/50 transition-colors group">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-body text-xs text-charcoal-muted">
                        {formatDate(exp.date)}
                      </span>
                      <span className="inline-flex w-fit px-2 py-0.5 bg-cream-dark text-charcoal rounded-md text-[10px] font-medium uppercase tracking-widest">
                        {exp.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-body text-sm text-charcoal leading-relaxed mb-4">
                    {exp.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-border flex justify-end">
                  <span className="font-display font-semibold text-rose-500 text-lg">
                    {formatCOP(exp.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Footer */}
        {!loading && expenses.length > 0 && (
          <div className="bg-white border border-border shadow-sm rounded-2xl px-6 py-5 flex justify-between items-center mt-6">
            <div>
              <span className="font-display text-sm uppercase tracking-widest text-charcoal-muted">Total Período</span>
            </div>
            <span className="font-display text-2xl font-bold text-rose-500">
              {formatCOP(totalGastos)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Modal Agregar Gasto */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-charcoal">Nuevo Gasto</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSaving}
                  className="p-2 text-charcoal-muted hover:bg-cream rounded-full disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4 font-body">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal-muted mb-2">Categoría</label>
                  <SearchableSelect
                    options={[
                      {value: "Proveedores", label: "Proveedores"},
                      {value: "Envíos", label: "Envíos"},
                      {value: "Operacional", label: "Operacional"},
                      {value: "Marketing", label: "Marketing"},
                      {value: "Otro", label: "Otro"}
                    ]}
                    value={newExpense.category}
                    onChange={(v) => setNewExpense({ ...newExpense, category: v })}
                    placeholder="Selecciona categoría"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal-muted mb-2">Descripción</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pago pauta Instagram"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    disabled={isSaving}
                    className="w-full bg-cream border border-border rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal-muted mb-2">Monto (COP)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    disabled={isSaving}
                    className="w-full bg-cream border border-border rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal-muted mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    disabled={isSaving}
                    className="w-full bg-cream border border-border rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full mt-4 py-4 rounded-xl font-semibold text-white bg-charcoal hover:bg-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? "Guardando..." : "Registrar Gasto"}
                  {!isSaving && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
