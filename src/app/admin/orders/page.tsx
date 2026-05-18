"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ChevronDown,
  MapPin,
  CreditCard,
  Package,
  Loader2,
  User,
  Phone,
  Mail,
  FileText,
  Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pendiente", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { value: "paid", label: "Pagado", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { value: "processing", label: "Procesando", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  { value: "shipped", label: "Enviado", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  { value: "delivered", label: "Entregado", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { value: "cancelled", label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/20" },
];

function getStatusConfig(status: OrderStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function parseNotes(notes: string | null | undefined) {
  if (!notes) return { name: null, email: null, phone: null, shipping: null };

  const contactMatch = notes.match(/^Contacto:\s*(.+?)(?:\s*\|\s*Env[íi]o:\s*(.+))?$/);
  if (!contactMatch) return { name: null, email: null, phone: null, shipping: null };

  const contactPart = contactMatch[1].trim();
  const shippingPart = contactMatch[2]?.trim() || null;

  // Format: "Full Name, email@example.com, 3001234567"
  const parts = contactPart.split(", ");
  const phone = parts.length >= 1 ? parts[parts.length - 1] : null;
  const email = parts.length >= 2 ? parts[parts.length - 2] : null;
  const name = parts.length >= 3 ? parts.slice(0, parts.length - 2).join(", ") : null;

  return { name, email, phone, shipping: shippingPart };
}

function StatusSelect({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: OrderStatus) => void }) {
  const [updating, setUpdating] = useState(false);
  const cfg = getStatusConfig(order.status);

  const handleChange = async (newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    setUpdating(true);
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (!error) { onUpdate(order.id, newStatus); toast.success("Estado actualizado"); }
    else toast.error("Error al actualizar");
    setUpdating(false);
  };

  return (
    <div className="relative">
      {updating ? (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body border ${cfg.color}`}>
          <Loader2 className="w-3 h-3 animate-spin" /> {cfg.label}
        </div>
      ) : (
        <div className="relative inline-flex items-center">
          <select
            className={`appearance-none pl-2.5 pr-6 py-1 rounded-lg text-xs font-body border cursor-pointer outline-none ${cfg.color} bg-transparent`}
            value={order.status}
            onChange={(e) => handleChange(e.target.value as OrderStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-white text-charcoal">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 w-3 h-3 pointer-events-none opacity-60" />
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, address:addresses(*), items:order_items(*, product:products(id, name, slug, images))")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.payment_method?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Órdenes</h1>
        <p className="font-body text-sm text-charcoal-muted">{orders.length} pedidos en total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm"
            placeholder="Buscar por ID, pago..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <SearchableSelect
            options={[{value: "all", label: "Todos los estados"}, ...STATUS_OPTIONS.map(s => ({value: s.value, label: s.label}))]}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as OrderStatus | "all")}
            placeholder="Todos los estados"
          />
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-border rounded-xl overflow-hidden shadow-sm"
            >
              {/* Order Row */}
              <div
                className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-cream/50 transition-colors flex-wrap"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="font-body text-sm text-charcoal font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-body text-xs text-charcoal-muted">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <StatusSelect order={order} onUpdate={handleStatusUpdate} />
                  <p className="font-display text-base text-charcoal font-semibold">{formatCOP(order.total)}</p>
                  <ChevronDown className={`w-4 h-4 text-charcoal-muted transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === order.id && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div>
                      <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-2">Productos</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-charcoal-muted" />
                              <span className="font-body text-xs text-charcoal">
                                {item.product?.name || item.product_id.slice(0, 8)}
                              </span>
                              <span className="font-body text-xs text-charcoal-muted">
                                × {item.quantity}{item.ml ? ` · ${item.ml}ml` : ""}
                              </span>
                            </div>
                            <span className="font-body text-xs text-charcoal font-medium">{formatCOP(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address + Payment */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {order.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="font-body text-xs text-charcoal-muted mb-0.5">Dirección</p>
                          <p className="font-body text-xs text-charcoal">
                            {[order.address.street, order.address.city, order.address.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.payment_method && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gold shrink-0" />
                        <div>
                          <p className="font-body text-xs text-charcoal-muted mb-0.5">Pago</p>
                          <p className="font-body text-xs text-charcoal capitalize">{order.payment_method}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cliente (from notes) */}
                  {(() => {
                    const { name, email, phone, shipping } = parseNotes((order as any).notes);
                    const hasContact = name || email || phone;
                    return (
                      <>
                        {hasContact && (
                          <div>
                            <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-2">Cliente</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {name && (
                                <div className="flex items-start gap-2">
                                  <User className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-body text-xs text-charcoal-muted mb-0.5">Nombre</p>
                                    <p className="font-body text-xs text-charcoal">{name}</p>
                                  </div>
                                </div>
                              )}
                              {email && (
                                <div className="flex items-start gap-2">
                                  <Mail className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-body text-xs text-charcoal-muted mb-0.5">Email</p>
                                    <p className="font-body text-xs text-charcoal break-all">{email}</p>
                                  </div>
                                </div>
                              )}
                              {phone && (
                                <div className="flex items-start gap-2">
                                  <Phone className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-body text-xs text-charcoal-muted mb-0.5">Teléfono</p>
                                    <p className="font-body text-xs text-charcoal">{phone}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dirección desde notes si no hay address_id */}
                        {!order.address && shipping && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                            <div>
                              <p className="font-body text-xs text-charcoal-muted mb-0.5">Dirección de envío</p>
                              <p className="font-body text-xs text-charcoal">{shipping}</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Referencia de pago */}
                  {(order as any).payment_ref && (
                    <div className="flex items-start gap-2">
                      <Receipt className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-body text-xs text-charcoal-muted mb-0.5">Referencia de pago</p>
                        <p className="font-body text-xs text-charcoal">{(order as any).payment_ref}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white border border-border rounded-xl py-12 text-center shadow-sm">
              <ShoppingBag className="w-8 h-8 text-gold/20 mx-auto mb-2" />
              <p className="font-body text-sm text-charcoal-muted">Sin pedidos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
