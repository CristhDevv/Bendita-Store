"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  Check,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { getUserOrders } from "@/lib/supabase/account";
import { useAuth } from "@/hooks/useAuth";
import type { Order, OrderStatus } from "@/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", Icon: Clock },
  paid: { label: "Pagado", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", Icon: CreditCard },
  processing: { label: "Procesando", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30", Icon: Package },
  shipped: { label: "Enviado", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30", Icon: Truck },
  delivered: { label: "Entregado", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", Icon: Check },
  cancelled: { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", Icon: XCircle },
};

const STATUS_TIMELINE: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.id)
      .then((orders) => {
        const found = orders.find((o) => o.id === id);
        setOrder(found ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, id]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-cream rounded-lg animate-pulse" />
        <div className="h-64 bg-cream rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm">
        <ShoppingBag className="w-12 h-12 text-gold mx-auto mb-4" />
        <p className="font-display text-lg text-charcoal mb-2">Pedido no encontrado</p>
        <p className="font-body text-sm text-charcoal-muted mb-6">
          No pudimos encontrar el pedido solicitado.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body font-semibold text-sm hover:bg-gold transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status];
  const currentStep = STATUS_TIMELINE.indexOf(order.status);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
      </Link>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-1">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-body text-sm text-charcoal-muted">
              {formatDate(order.created_at)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body border ${cfg.bg} ${cfg.color}`}
          >
            <cfg.Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>

        {/* Status Timeline */}
        {order.status !== "cancelled" && (
          <div className="mb-8 overflow-x-auto pb-4">
            <div className="flex items-center min-w-[500px] gap-0">
              {STATUS_TIMELINE.map((step, i) => {
                const stepCfg = STATUS_CONFIG[step];
                const done = i <= currentStep;
                const isLast = i === STATUS_TIMELINE.length - 1;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? "bg-gold border-gold text-white" : "border-border text-border"
                        }`}
                      >
                        <stepCfg.Icon className="w-3 h-3" />
                      </div>
                      <span
                        className={`text-[9px] font-body whitespace-nowrap ${
                          done ? "text-gold" : "text-charcoal-muted"
                        }`}
                      >
                        {stepCfg.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`flex-1 h-0.5 mx-1 mb-4 ${
                          i < currentStep ? "bg-gold" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-6">
            <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-3 font-semibold">
              Productos
            </p>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-cream border border-border hover:border-gold/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gold/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-charcoal truncate">
                      {item.product?.name || "Producto"}
                    </p>
                    <p className="font-body text-xs text-charcoal-muted mt-0.5">
                      Cantidad: {item.quantity} · {item.ml ? `${item.ml}ml` : ""}
                    </p>
                    <p className="font-body text-xs text-charcoal-muted">
                      Precio Unitario: {formatCOP(item.price)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-[10px] text-charcoal-muted">Subtotal</p>
                    <p className="font-display text-sm font-bold text-gold">
                      {formatCOP(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        {order.address && (
          <div className="mb-6 p-4 rounded-xl bg-cream border border-border">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-1">
                  Dirección de envío
                </p>
                <p className="font-body text-sm text-charcoal">
                  {[order.address.street, order.address.city, order.address.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment + Total */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-charcoal-muted">
            <CreditCard className="w-4 h-4" />
            <span className="font-body text-sm capitalize">
              {order.payment_method || "—"}
            </span>
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-charcoal-muted">Total</p>
            <p className="font-display text-xl text-gold font-bold">{formatCOP(order.total)}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
