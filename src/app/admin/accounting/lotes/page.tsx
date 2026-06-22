"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Package,
  FlaskConical,
  Layers,
  Loader2,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  cost_price: number | null;
  price: number;
}

interface Supply {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost: number;
}

interface SelectedSupply {
  supplyId: string;
  quantityUsedPerUnit: number;
}

interface LotItemInput {
  productId: string;
  unitsProduced: number;
  usedSupplies: SelectedSupply[];
}

// ─── Helpers ─────────────────────────────────────────────────

const formatCOP = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(val);

// ─── Step Indicator ──────────────────────────────────────────

const STEPS = [
  { label: "Producción", icon: Layers },
  { label: "Productos", icon: Package },
  { label: "Insumos", icon: FlaskConical },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const isCompleted = idx < current;
        const isActive = idx === current;

        return (
          <div key={idx} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: isCompleted
                    ? "#B8960C"
                    : isActive
                    ? "#1A1A1A"
                    : "#E8E4DC",
                  borderColor: isCompleted || isActive ? "#B8960C" : "#E8E4DC",
                }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm"
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <StepIcon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-charcoal-muted"
                    }`}
                  />
                )}
              </motion.div>
              <span
                className={`mt-1.5 font-body text-[10px] font-semibold uppercase tracking-wider ${
                  isActive
                    ? "text-charcoal"
                    : isCompleted
                    ? "text-gold"
                    : "text-charcoal-muted"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="relative mx-3 mb-4">
                <div className="h-[2px] w-16 sm:w-24 bg-border rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="h-full bg-gold"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Production Info ────────────────────────────────

function Step1({
  lotName,
  setLotName,
  shippingCost,
  setShippingCost,
  lotNotes,
  setLotNotes,
  onNext,
}: {
  lotName: string;
  setLotName: (v: string) => void;
  shippingCost: number;
  setShippingCost: (v: number) => void;
  lotNotes: string;
  setLotNotes: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl text-charcoal mb-1">
          ¿Qué vas a producir hoy?
        </h2>
        <p className="font-body text-sm text-charcoal-muted">
          Empieza por darle un nombre a esta producción y registrar el flete.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        {/* Lot Name */}
        <div>
          <label className="block font-body text-xs text-charcoal-muted mb-1.5 font-semibold uppercase tracking-wider">
            Dale un nombre a esta producción *
          </label>
          <input
            type="text"
            value={lotName}
            onChange={(e) => setLotName(e.target.value)}
            placeholder="Ej: Producción Mayo - Perfumes Mujer"
            className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Shipping Cost */}
        <div>
          <label className="block font-body text-xs text-charcoal-muted mb-1.5 font-semibold uppercase tracking-wider">
            ¿Cuánto pagaste de envío o flete por los insumos? (COP)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-charcoal-muted" />
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              min={0}
              placeholder="0"
              className="w-full pl-9 pr-4 py-3 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Info className="w-3.5 h-3.5 text-charcoal-muted" />
            <p className="font-body text-xs text-charcoal-muted">
              Si no tuviste flete, deja en 0.
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-body text-xs text-charcoal-muted mb-1.5 font-semibold uppercase tracking-wider">
            Notas (opcional)
          </label>
          <textarea
            value={lotNotes}
            onChange={(e) => setLotNotes(e.target.value)}
            placeholder="Ej: Producción realizada con insumos premium..."
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold resize-none transition-colors"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!lotName.trim()}
          className="flex items-center gap-2 px-8 py-3 bg-charcoal text-white rounded-xl font-body text-sm font-bold hover:bg-gold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 2 — Products ───────────────────────────────────────

function Step2({
  products,
  lotItems,
  setLotItems,
  onNext,
  onBack,
}: {
  products: Product[];
  lotItems: LotItemInput[];
  setLotItems: React.Dispatch<React.SetStateAction<LotItemInput[]>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id ?? ""
  );
  const [unitsProduced, setUnitsProduced] = useState<number>(1);

  const handleAddProduct = () => {
    if (!selectedProductId || unitsProduced < 1) return;
    setLotItems((prev) => [
      ...prev,
      { productId: selectedProductId, unitsProduced, usedSupplies: [] },
    ]);
    setUnitsProduced(1);
    setPanelOpen(false);
  };

  const handleRemove = (index: number) => {
    setLotItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl text-charcoal mb-1">
          ¿Qué productos fabricaste?
        </h2>
        <p className="font-body text-sm text-charcoal-muted">
          Agrega los productos que fabricaste en esta producción.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        {/* Product List */}
        <AnimatePresence>
          {lotItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-cream/20 border border-dashed border-border rounded-xl mb-4"
            >
              <Package className="w-10 h-10 text-gold/30 mx-auto mb-2" />
              <p className="font-body text-sm text-charcoal-muted">
                Aún no has agregado productos.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 mb-4">
              {lotItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between gap-4 border border-border rounded-xl p-4 bg-cream/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal">
                          {prod?.name ?? "Desconocido"}
                        </p>
                        <p className="font-body text-xs text-charcoal-muted">
                          {item.unitsProduced} unidades a producir
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-charcoal-muted hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Inline Add Panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border border-gold/30 rounded-xl p-5 bg-gold-pale/30 mb-4 space-y-4">
                <p className="font-body text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  Nuevo Producto
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                      Producto
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-white focus:outline-none focus:border-gold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                      Unidades Fabricadas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={unitsProduced}
                      onChange={(e) => setUnitsProduced(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border font-body text-xs text-charcoal-muted hover:text-charcoal transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={!selectedProductId || unitsProduced < 1}
                    className="px-5 py-2 bg-charcoal text-white rounded-xl font-body text-xs font-bold hover:bg-gold transition-colors disabled:opacity-40"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open Panel Button */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            disabled={products.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-xl font-body text-sm text-charcoal-muted hover:text-gold hover:border-gold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-body text-sm text-charcoal-muted hover:text-charcoal hover:border-charcoal transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={lotItems.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-charcoal text-white rounded-xl font-body text-sm font-bold hover:bg-gold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Product Card (Step 3) ───────────────────────────────────

function ProductCard({
  item,
  itemIndex,
  products,
  supplies,
  shippingCost,
  totalUnitsProduced,
  onUpdateSupplies,
}: {
  item: LotItemInput;
  itemIndex: number;
  products: Product[];
  supplies: Supply[];
  shippingCost: number;
  totalUnitsProduced: number;
  onUpdateSupplies: (itemIndex: number, usedSupplies: SelectedSupply[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newSupplyId, setNewSupplyId] = useState(supplies[0]?.id ?? "");
  const [newQty, setNewQty] = useState<number>(0);

  const product = products.find((p) => p.id === item.productId);

  // Reactive cost calculations
  const costs = useMemo(() => {
    const suppliesCost = item.usedSupplies.reduce((sum, sel) => {
      const masterSupply = supplies.find((s) => s.id === sel.supplyId);
      if (!masterSupply || masterSupply.quantity <= 0) return sum;
      const unitCost = masterSupply.cost / masterSupply.quantity;
      return sum + unitCost * (Number(sel.quantityUsedPerUnit) || 0);
    }, 0);

    const shippingShare =
      totalUnitsProduced > 0
        ? (item.unitsProduced / totalUnitsProduced) * shippingCost
        : 0;
    const shippingPerUnit =
      item.unitsProduced > 0 ? shippingShare / item.unitsProduced : 0;

    return {
      suppliesCost,
      shippingPerUnit,
      finalUnitCost: suppliesCost + shippingPerUnit,
    };
  }, [item, supplies, shippingCost, totalUnitsProduced]);

  const handleAddSupply = () => {
    if (!newSupplyId || newQty <= 0) return;
    onUpdateSupplies(itemIndex, [
      ...item.usedSupplies,
      { supplyId: newSupplyId, quantityUsedPerUnit: newQty },
    ]);
    setNewQty(0);
    setPanelOpen(false);
  };

  const handleRemoveSupply = (supplyIdx: number) => {
    onUpdateSupplies(
      itemIndex,
      item.usedSupplies.filter((_, i) => i !== supplyIdx)
    );
  };

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-cream/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-charcoal flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-body text-sm font-semibold text-charcoal">
              {product?.name ?? "Producto"}
            </p>
            <p className="font-body text-xs text-charcoal-muted">
              {item.unitsProduced} unidades ·{" "}
              {item.usedSupplies.length} insumo
              {item.usedSupplies.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live cost badge */}
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-gold/10 font-body text-xs font-bold text-gold border border-gold/20">
            {formatCOP(costs.finalUnitCost)}/un.
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-charcoal-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-charcoal-muted" />
          )}
        </div>
      </button>

      {/* Card Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border">
              {/* Supply Rows */}
              <div className="pt-4 space-y-2">
                {item.usedSupplies.length === 0 ? (
                  <p className="font-body text-xs text-charcoal-muted italic">
                    Sin insumos asociados todavía.
                  </p>
                ) : (
                  item.usedSupplies.map((used, supplyIdx) => {
                    const masterSupply = supplies.find(
                      (s) => s.id === used.supplyId
                    );
                    const unitCost = masterSupply
                      ? masterSupply.cost / (masterSupply.quantity || 1)
                      : 0;
                    const subtotal = unitCost * (used.quantityUsedPerUnit || 0);

                    return (
                      <div
                        key={supplyIdx}
                        className="flex items-center gap-3 bg-cream/20 border border-border/50 rounded-lg px-4 py-2.5 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs font-semibold text-charcoal truncate">
                            {masterSupply?.name ?? "—"}
                          </p>
                          <p className="font-body text-[10px] text-charcoal-muted">
                            {used.quantityUsedPerUnit} {masterSupply?.unit} · {formatCOP(unitCost)}/{masterSupply?.unit}
                          </p>
                        </div>
                        <span className="font-body text-xs font-bold text-gold shrink-0">
                          {formatCOP(subtotal)}
                        </span>
                        <button
                          onClick={() => handleRemoveSupply(supplyIdx)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-charcoal-muted hover:text-rose-500 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Supply Panel */}
              <AnimatePresence>
                {panelOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-gold/30 bg-gold-pale/30 rounded-xl p-4 space-y-3">
                      <p className="font-body text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">
                        Añadir Insumo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-body text-[10px] text-charcoal-muted mb-1 font-semibold uppercase">
                            Insumo
                          </label>
                          <select
                            value={newSupplyId}
                            onChange={(e) => setNewSupplyId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg font-body text-xs text-charcoal bg-white focus:outline-none focus:border-gold"
                          >
                            {supplies.map((s) => {
                              const uc =
                                s.quantity > 0 ? s.cost / s.quantity : 0;
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.unit}) — {formatCOP(uc)}/{s.unit}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block font-body text-[10px] text-charcoal-muted mb-1 font-semibold uppercase">
                            Cantidad usada por unidad
                          </label>
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={newQty}
                            onChange={(e) => setNewQty(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-lg font-body text-xs text-charcoal bg-white focus:outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setPanelOpen(false)}
                          className="px-3 py-1.5 rounded-lg border border-border font-body text-[10px] text-charcoal-muted hover:text-charcoal transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleAddSupply}
                          disabled={!newSupplyId || newQty <= 0}
                          className="px-4 py-1.5 bg-charcoal text-white rounded-lg font-body text-[10px] font-bold hover:bg-gold transition-colors disabled:opacity-40"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!panelOpen && (
                <button
                  onClick={() => setPanelOpen(true)}
                  disabled={supplies.length === 0}
                  className="flex items-center gap-1.5 font-body text-xs font-semibold text-gold hover:underline disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Insumo
                </button>
              )}

              {/* Cost Summary */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="font-body text-[10px] text-charcoal-muted uppercase font-semibold mb-0.5">
                    Insumos/unidad
                  </p>
                  <p className="font-body text-sm font-bold text-charcoal">
                    {formatCOP(costs.suppliesCost)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-body text-[10px] text-charcoal-muted uppercase font-semibold mb-0.5">
                    Flete/unidad
                  </p>
                  <p className="font-body text-sm font-bold text-charcoal">
                    {formatCOP(costs.shippingPerUnit)}
                  </p>
                </div>
                <div className="text-center bg-gold/5 border border-gold/20 rounded-xl p-2">
                  <p className="font-body text-[10px] text-gold uppercase font-bold mb-0.5">
                    Costo total/unidad
                  </p>
                  <p className="font-display text-base font-bold text-gold">
                    {formatCOP(costs.finalUnitCost)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 3 — Supplies ───────────────────────────────────────

function Step3({
  products,
  supplies,
  lotItems,
  setLotItems,
  shippingCost,
  lotName,
  onBack,
  onSave,
  saving,
  successData,
  saveError,
  setSaveError,
}: {
  products: Product[];
  supplies: Supply[];
  lotItems: LotItemInput[];
  setLotItems: React.Dispatch<React.SetStateAction<LotItemInput[]>>;
  shippingCost: number;
  lotName: string;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  successData: { productName: string; finalCost: number }[] | null;
  saveError: string | null;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const totalUnitsProduced = lotItems.reduce(
    (acc, item) => acc + (Number(item.unitsProduced) || 0),
    0
  );

  const handleUpdateSupplies = (
    itemIndex: number,
    usedSupplies: SelectedSupply[]
  ) => {
    setLotItems((prev) => {
      const copy = [...prev];
      copy[itemIndex] = { ...copy[itemIndex], usedSupplies };
      return copy;
    });
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl text-charcoal mb-1">
          ¿Qué insumos usaste por producto?
        </h2>
        <p className="font-body text-sm text-charcoal-muted">
          Registra los materiales consumidos para calcular el costo real de cada unidad.
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3"
          >
            <span className="text-rose-500 mt-0.5 shrink-0">⚠</span>
            <div className="flex-1">
              <p className="font-body text-sm font-bold text-rose-700 mb-0.5">Error al guardar</p>
              <p className="font-body text-sm text-rose-600">{saveError}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-rose-400 hover:text-rose-600 font-body text-xs shrink-0"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-body text-sm font-bold">
                ¡Producción guardada exitosamente!
              </span>
            </div>
            {successData.map((d, i) => (
              <p key={i} className="font-body text-sm text-emerald-700">
                Costo final por unidad de{" "}
                <strong>{d.productName}</strong>:{" "}
                <strong>{formatCOP(d.finalCost)}</strong>
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Cards */}
      <div className="space-y-4 mb-6">
        {lotItems.map((item, idx) => (
          <ProductCard
            key={idx}
            item={item}
            itemIndex={idx}
            products={products}
            supplies={supplies}
            shippingCost={shippingCost}
            totalUnitsProduced={totalUnitsProduced}
            onUpdateSupplies={handleUpdateSupplies}
          />
        ))}
      </div>

      {/* Nav Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-body text-sm text-charcoal-muted hover:text-charcoal hover:border-charcoal transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-charcoal text-white rounded-xl font-body text-sm font-bold hover:bg-gold transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Guardar Producción
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function LotesPage() {
  const supabase = createClient();

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);

  // Wizard State
  const [step, setStep] = useState(0);

  // Step 1
  const [lotName, setLotName] = useState("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [lotNotes, setLotNotes] = useState("");

  // Step 2 & 3
  const [lotItems, setLotItems] = useState<LotItemInput[]>([]);

  // Actions
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<
    { productName: string; finalCost: number }[] | null
  >(null);

  // Load master data
  useEffect(() => {
    async function loadData() {
      setMasterLoading(true);
      try {
        const [{ data: prodData }, { data: supData }] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, cost_price, price")
            .eq("is_active", true)
            .order("name"),
          supabase.from("supplies").select("id, name, unit, quantity, cost"),
        ]);
        setProducts(prodData || []);
        setSupplies(supData || []);
      } catch (e) {
        console.error("Error cargando datos:", e);
      } finally {
        setMasterLoading(false);
      }
    }
    loadData();
  }, []);

  // Total units (for shipping proration)
  const totalUnitsProduced = useMemo(
    () =>
      lotItems.reduce((acc, item) => acc + (Number(item.unitsProduced) || 0), 0),
    [lotItems]
  );

  // Compute per-item costs (for save)
  const getItemCosts = (item: LotItemInput) => {
    const suppliesCost = item.usedSupplies.reduce((sum, sel) => {
      const masterSupply = supplies.find((s) => s.id === sel.supplyId);
      if (!masterSupply || masterSupply.quantity <= 0) return sum;
      const unitCost = masterSupply.cost / masterSupply.quantity;
      return sum + unitCost * (Number(sel.quantityUsedPerUnit) || 0);
    }, 0);

    const share =
      totalUnitsProduced > 0
        ? (item.unitsProduced / totalUnitsProduced) * shippingCost
        : 0;
    const shippingPerUnit =
      item.unitsProduced > 0 ? share / item.unitsProduced : 0;
    const finalUnitCost = suppliesCost + shippingPerUnit;

    return { suppliesCost, shippingCostShare: share, shippingPerUnit, finalUnitCost };
  };

  const handleSave = async () => {
    if (!lotName.trim() || lotItems.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    setSuccessData(null);
    try {
      // 1. Insert production lot
      const { data: lotData, error: lotError } = await supabase
        .from("production_lots")
        .insert([
          { name: lotName, shipping_cost: shippingCost, notes: lotNotes || null },
        ])
        .select()
        .single();

      if (lotError) throw lotError;

      const resultCosts: { productName: string; finalCost: number }[] = [];

      // 2. Insert items & supplies
      for (const item of lotItems) {
        const { shippingCostShare, finalUnitCost } = getItemCosts(item);

        const { data: itemData, error: itemError } = await supabase
          .from("production_lot_items")
          .insert([
            {
              lot_id: lotData.id,
              product_id: item.productId,
              units_produced: item.unitsProduced,
              shipping_cost_share: shippingCostShare,
            },
          ])
          .select()
          .single();

        if (itemError) throw itemError;

        if (item.usedSupplies.length > 0) {
          const supplyInserts = item.usedSupplies.map((sel) => {
            const masterSupply = supplies.find((s) => s.id === sel.supplyId);
            const unitCost = masterSupply
              ? masterSupply.cost / (masterSupply.quantity || 1)
              : 0;
            return {
              lot_item_id: itemData.id,
              supply_id: sel.supplyId,
              quantity_used: sel.quantityUsedPerUnit,
              unit_cost: unitCost,
            };
          });

          const { error: lotSupError } = await supabase
            .from("production_lot_item_supplies")
            .insert(supplyInserts);

          if (lotSupError) throw lotSupError;
        }

        const product = products.find((p) => p.id === item.productId);
        resultCosts.push({
          productName: product?.name ?? "Producto",
          finalCost: finalUnitCost,
        });
      }

      // Show success & reset
      setSuccessData(resultCosts);
      setTimeout(() => {
        setSuccessData(null);
        setStep(0);
        setLotName("");
        setShippingCost(0);
        setLotNotes("");
        setLotItems([]);
      }, 5000);
    } catch (e) {
      console.error("Error guardando lote:", e);
      setSaveError(
        "Ocurrió un error al guardar la producción. Revisa tu conexión e inténtalo de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  if (masterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="font-body text-sm text-charcoal-muted">
            Cargando datos de producción...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">
          Lotes de Producción
        </h1>
        <p className="font-body text-sm text-charcoal-muted">
          Calcula y distribuye costos de fletes y materias primas en tus lotes de producción.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border border-border rounded-2xl px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
            Paso {step + 1} de {STEPS.length}
          </p>
          <p className="font-body text-xs text-charcoal-muted">
            {["Información del Lote", "Productos Fabricados", "Insumos por Producto"][step]}
          </p>
        </div>
        <StepIndicator current={step} />

        {/* Step Content */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step1
                key="s1"
                lotName={lotName}
                setLotName={setLotName}
                shippingCost={shippingCost}
                setShippingCost={setShippingCost}
                lotNotes={lotNotes}
                setLotNotes={setLotNotes}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && (
              <Step2
                key="s2"
                products={products}
                lotItems={lotItems}
                setLotItems={setLotItems}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <Step3
                key="s3"
                products={products}
                supplies={supplies}
                lotItems={lotItems}
                setLotItems={setLotItems}
                shippingCost={shippingCost}
                lotName={lotName}
                onBack={() => setStep(1)}
                onSave={handleSave}
                saving={saving}
                successData={successData}
                saveError={saveError}
                setSaveError={setSaveError}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
