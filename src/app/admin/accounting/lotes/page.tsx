"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calculator,
  RefreshCw,
  Check,
  Package,
  Info,
  DollarSign,
  AlertCircle,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function LotesPage() {
  const supabase = createClient();

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  // Lot Form State
  const [lotName, setLotName] = useState("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [lotNotes, setLotNotes] = useState("");

  // Lot Items State
  const [lotItems, setLotItems] = useState<LotItemInput[]>([]);

  // Action states
  const [savingLot, setSavingLot] = useState(false);
  const [updatingProductCost, setUpdatingProductCost] = useState<Record<string, boolean>>({});
  const [appliedProductCost, setAppliedProductCost] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load Products & Supplies
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: prodData }, { data: supData }] = await Promise.all([
          supabase.from("products").select("id, name, cost_price, price").eq("is_active", true).order("name"),
          supabase.from("supplies").select("id, name, unit, quantity, cost"),
        ]);
        setProducts(prodData || []);
        setSupplies(supData || []);
      } catch (e) {
        console.error("Error cargando datos:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format currency
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Add dynamic product row
  const addProductToLot = () => {
    if (products.length === 0) return;
    setLotItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        unitsProduced: 1,
        usedSupplies: [],
      },
    ]);
  };

  const removeProductFromLot = (index: number) => {
    setLotItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLotItem = (index: number, key: keyof LotItemInput, value: any) => {
    setLotItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  // Add raw material used per product unit
  const addSupplyToProduct = (itemIndex: number) => {
    if (supplies.length === 0) return;
    const item = lotItems[itemIndex];
    updateLotItem(itemIndex, "usedSupplies", [
      ...item.usedSupplies,
      { supplyId: supplies[0].id, quantityUsedPerUnit: 0 },
    ]);
  };

  const removeSupplyFromProduct = (itemIndex: number, supplyIndex: number) => {
    const item = lotItems[itemIndex];
    const filtered = item.usedSupplies.filter((_, idx) => idx !== supplyIndex);
    updateLotItem(itemIndex, "usedSupplies", filtered);
  };

  const updateUsedSupply = (itemIndex: number, supplyIndex: number, key: keyof SelectedSupply, value: any) => {
    const item = lotItems[itemIndex];
    const copy = [...item.usedSupplies];
    copy[supplyIndex] = { ...copy[supplyIndex], [key]: value };
    updateLotItem(itemIndex, "usedSupplies", copy);
  };

  // Calculations
  const totalUnitsProduced = lotItems.reduce((acc, item) => acc + (Number(item.unitsProduced) || 0), 0);

  // Compute item metrics
  const getItemCosts = (item: LotItemInput) => {
    // 1. Raw materials cost
    const suppliesCost = item.usedSupplies.reduce((sum, sel) => {
      const masterSupply = supplies.find((s) => s.id === sel.supplyId);
      if (!masterSupply || masterSupply.quantity <= 0) return sum;
      const unitCost = masterSupply.cost / masterSupply.quantity;
      return sum + unitCost * (Number(sel.quantityUsedPerUnit) || 0);
    }, 0);

    // 2. Shipping cost allocation (proportional)
    const share = totalUnitsProduced > 0 ? (item.unitsProduced / totalUnitsProduced) * shippingCost : 0;
    const shippingCostPerUnit = item.unitsProduced > 0 ? share / item.unitsProduced : 0;

    // 3. Final unit cost
    const finalUnitCost = suppliesCost + shippingCostPerUnit;

    return {
      suppliesCost,
      shippingCostPerUnit,
      finalUnitCost,
      shippingCostShare: share,
    };
  };

  // Save the complete production lot batch
  const handleSaveLot = async () => {
    if (!lotName.trim() || lotItems.length === 0 || savingLot) return;
    setSavingLot(true);
    try {
      // 1. Save to production_lots
      const { data: lotData, error: lotError } = await supabase
        .from("production_lots")
        .insert([{ name: lotName, shipping_cost: shippingCost, notes: lotNotes || null }])
        .select()
        .single();

      if (lotError) throw lotError;

      // 2. Save items & supplies
      for (const item of lotItems) {
        const { suppliesCost, shippingCostShare } = getItemCosts(item);
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
            const unitCost = masterSupply ? masterSupply.cost / (masterSupply.quantity || 1) : 0;
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
      }

      setSuccessMessage("¡Lote de producción guardado con éxito!");
      // Reset lot form
      setLotName("");
      setShippingCost(0);
      setLotNotes("");
      setLotItems([]);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e) {
      console.error("Error guardando lote:", e);
    } finally {
      setSavingLot(false);
    }
  };

  // Directly apply unit cost to product table
  const handleApplyCostToProduct = async (productId: string, unitCost: number, index: number) => {
    setUpdatingProductCost((prev) => ({ ...prev, [productId]: true }));
    try {
      const { error } = await supabase
        .from("products")
        .update({ cost_price: unitCost })
        .eq("id", productId);

      if (error) throw error;
      setAppliedProductCost((prev) => ({ ...prev, [productId]: true }));
      // Reload product cost_price list to sync
      const { data } = await supabase.from("products").select("id, name, cost_price, price").eq("is_active", true).order("name");
      if (data) setProducts(data);
    } catch (e) {
      console.error("Error aplicando costo al producto:", e);
    } finally {
      setUpdatingProductCost((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Lotes de Producción</h1>
        <p className="font-body text-sm text-charcoal-muted">
          Calcula y distribuye costos de fletes y materias primas en tus lotes de producción
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700">
          <Check className="w-5 h-5" />
          <span className="font-body text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Lot Header config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-lg text-charcoal mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Detalles del Lote
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                  Identificador del Lote *
                </label>
                <input
                  type="text"
                  value={lotName}
                  onChange={(e) => setLotName(e.target.value)}
                  placeholder="Ej. Lote Perfumes Mayo, Batch #12..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                  Costo de Envío / Flete Total (COP)
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-charcoal-muted mb-1 font-semibold uppercase">
                  Notas de Producción
                </label>
                <textarea
                  value={lotNotes}
                  onChange={(e) => setLotNotes(e.target.value)}
                  placeholder="Ej. Producción realizada con insumos premium..."
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-cream/30 focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveLot}
                  disabled={!lotName.trim() || lotItems.length === 0 || savingLot}
                  className="w-full py-3 bg-charcoal text-white rounded-xl font-body text-sm font-bold hover:bg-gold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {savingLot ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {savingLot ? "Guardando Lote..." : "Guardar Lote de Producción"}
                </button>
              </div>
            </div>
          </div>

          {/* Allocation Info Card */}
          <div className="bg-cream/40 border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-display text-sm text-charcoal font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-gold" />
              Distribución de Fletes
            </h3>
            <p className="font-body text-xs text-charcoal-muted leading-relaxed">
              El flete se prorratea equitativamente entre el total de las unidades producidas en el lote. 
              Actualmente hay un total de <span className="font-semibold text-charcoal">{totalUnitsProduced} unidades</span>.
            </p>
            {totalUnitsProduced > 0 && shippingCost > 0 && (
              <div className="pt-2 border-t border-border/50 flex justify-between">
                <span className="font-body text-xs text-charcoal-muted">Flete por unidad:</span>
                <span className="font-display text-xs font-bold text-gold">
                  {formatCOP(shippingCost / totalUnitsProduced)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns - Production Lot Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-charcoal">Productos en este Lote</h2>
              <button
                onClick={addProductToLot}
                disabled={products.length === 0}
                className="flex items-center gap-1 px-4 py-2 bg-cream text-charcoal hover:text-white border border-border rounded-xl font-body text-xs font-semibold hover:bg-gold hover:border-gold transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar Producto
              </button>
            </div>

            {lotItems.length === 0 ? (
              <div className="text-center py-16 bg-cream/10 border border-dashed border-border rounded-2xl">
                <Package className="w-10 h-10 text-gold/30 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">No has agregado productos al lote.</p>
                <button
                  onClick={addProductToLot}
                  className="mt-3 text-xs font-semibold text-gold hover:underline"
                >
                  Agregar tu primer producto
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {lotItems.map((item, index) => {
                  const selectedProduct = products.find((p) => p.id === item.productId);
                  const { suppliesCost, shippingCostPerUnit, finalUnitCost } = getItemCosts(item);
                  const isCostApplied = appliedProductCost[item.productId];

                  return (
                    <div
                      key={index}
                      className="border border-border rounded-xl p-5 bg-cream/20 flex flex-col gap-4"
                    >
                      {/* Product selector & Units produced */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="block font-body text-[10px] text-charcoal-muted font-bold uppercase mb-1">
                            Seleccionar Producto
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateLotItem(index, "productId", e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-white focus:outline-none focus:border-gold"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Precio: {formatCOP(p.price)} - Costo Actual: {p.cost_price ? formatCOP(p.cost_price) : "Sin costo"})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-32 shrink-0">
                          <label className="block font-body text-[10px] text-charcoal-muted font-bold uppercase mb-1">
                            Unidades Producidas
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.unitsProduced}
                            onChange={(e) => updateLotItem(index, "unitsProduced", Number(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-charcoal bg-white focus:outline-none focus:border-gold"
                          />
                        </div>

                        <button
                          onClick={() => removeProductFromLot(index)}
                          className="self-end sm:self-center p-2 rounded-lg text-charcoal-muted hover:text-rose-600 hover:bg-rose-50 border border-border sm:border-transparent transition-colors mt-2 sm:mt-4"
                          title="Eliminar producto de este lote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Used supplies section */}
                      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-body text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                            Insumos y Materias Primas por Unidad
                          </h4>
                          <button
                            onClick={() => addSupplyToProduct(index)}
                            disabled={supplies.length === 0}
                            className="flex items-center gap-0.5 font-body text-[10px] font-bold text-gold hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Añadir Insumo
                          </button>
                        </div>

                        {item.usedSupplies.length === 0 ? (
                          <p className="font-body text-xs text-charcoal-muted italic py-1">
                            Sin insumos asociados para este producto.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {item.usedSupplies.map((used, supplyIdx) => {
                              const selectedMasterSupply = supplies.find((s) => s.id === used.supplyId);

                              return (
                                <div
                                  key={supplyIdx}
                                  className="flex items-center gap-3 bg-cream/10 p-2 rounded-lg border border-border/40"
                                >
                                  <div className="flex-1">
                                    <select
                                      value={used.supplyId}
                                      onChange={(e) => updateUsedSupply(index, supplyIdx, "supplyId", e.target.value)}
                                      className="w-full px-2 py-1.5 border border-border rounded bg-white font-body text-xs text-charcoal focus:outline-none"
                                    >
                                      {supplies.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({s.unit})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="w-32 shrink-0 flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="Cant."
                                      value={used.quantityUsedPerUnit}
                                      onChange={(e) => updateUsedSupply(index, supplyIdx, "quantityUsedPerUnit", Number(e.target.value))}
                                      className="w-full px-2 py-1.5 border border-border rounded font-body text-xs text-charcoal bg-white focus:outline-none"
                                    />
                                    <span className="font-body text-xs text-charcoal-muted shrink-0 w-8">
                                      {selectedMasterSupply?.unit || "ml"}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => removeSupplyFromProduct(index, supplyIdx)}
                                    className="p-1 rounded hover:bg-rose-50 text-charcoal-muted hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Calculations & Cost Updating */}
                      <div className="bg-cream/20 border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="grid grid-cols-3 gap-4 flex-1">
                          <div>
                            <p className="font-body text-[10px] text-charcoal-muted uppercase">Insumos / Unit.</p>
                            <p className="font-body text-sm font-semibold text-charcoal">{formatCOP(suppliesCost)}</p>
                          </div>
                          <div>
                            <p className="font-body text-[10px] text-charcoal-muted uppercase">Flete / Unit.</p>
                            <p className="font-body text-sm font-semibold text-charcoal">{formatCOP(shippingCostPerUnit)}</p>
                          </div>
                          <div>
                            <p className="font-body text-[10px] text-gold uppercase font-bold">Costo Final Unit.</p>
                            <p className="font-display text-base font-bold text-gold">{formatCOP(finalUnitCost)}</p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            onClick={() => handleApplyCostToProduct(item.productId, finalUnitCost, index)}
                            disabled={updatingProductCost[item.productId] || isCostApplied}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-xs font-bold transition-all shadow-sm border ${
                              isCostApplied
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-charcoal border-charcoal text-white hover:bg-gold hover:border-gold"
                            }`}
                          >
                            {updatingProductCost[item.productId] ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isCostApplied ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <DollarSign className="w-3.5 h-3.5" />
                            )}
                            {updatingProductCost[item.productId]
                              ? "Aplicando..."
                              : isCostApplied
                              ? "Costo Aplicado"
                              : "Aplicar Costo a Producto"}
                          </button>
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
