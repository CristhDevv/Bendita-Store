import { motion, AnimatePresence } from "framer-motion";
import { X, Package, MapPin, CreditCard, Clock, Truck, Check, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30",
    Icon: Clock,
  },
  paid: {
    label: "Pagado",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
    Icon: CreditCard,
  },
  processing: {
    label: "Procesando",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30",
    Icon: Package,
  },
  shipped: {
    label: "Enviado",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/30",
    Icon: Truck,
  },
  delivered: {
    label: "Entregado",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30",
    Icon: Check,
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
    Icon: XCircle,
  },
};

export const STATUS_TIMELINE: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

export function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const currentStep = STATUS_TIMELINE.indexOf(order.status);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-border rounded-2xl p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-body text-xs text-charcoal-muted uppercase tracking-widest mb-1">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="font-body text-sm text-charcoal-muted">
                {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body border ${cfg.bg} ${cfg.color}`}
              >
                <cfg.Icon className="w-3 h-3" />
                {cfg.label}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Timeline */}
          {order.status !== "cancelled" && (
            <div className="mb-6">
              <div className="flex items-center gap-0">
                {STATUS_TIMELINE.map((step, i) => {
                  const stepCfg = STATUS_CONFIG[step];
                  const done = i <= currentStep;
                  const isLast = i === STATUS_TIMELINE.length - 1;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                            done
                              ? "bg-gold border-gold text-white"
                              : "border-border text-border"
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
              <p className="font-body text-xs uppercase tracking-widest text-charcoal-muted mb-3">
                Productos
              </p>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-cream border border-border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gold/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-charcoal truncate">
                        {item.product?.name || "Producto"}
                      </p>
                      <p className="font-body text-xs text-charcoal-muted">
                        {item.quantity}x
                        {item.ml ? ` · ${item.ml}ml` : ""}
                      </p>
                    </div>
                    <p className="font-body text-sm font-medium text-gold shrink-0">
                      {formatCOP(item.price * item.quantity)}
                    </p>
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
                    {[
                      order.address.street,
                      order.address.city,
                      order.address.state,
                    ]
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
              <p className="font-display text-xl text-gold">
                {formatCOP(order.total)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
