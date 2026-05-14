"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  X,
  MapPin,
  CreditCard,
  Package,
  Check,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";
import { getUserOrders } from "@/lib/supabase/account";
import { useAuth } from "@/hooks/useAuth";
import type { Order, OrderStatus } from "@/types";

import dynamic from "next/dynamic";
import { STATUS_CONFIG, formatDate, formatCOP } from "./OrderDetailModal";

const OrderDetailModal = dynamic(() => import("./OrderDetailModal").then((mod) => mod.OrderDetailModal), { ssr: false });

// ─── Orders List ─────────────────────────────────────────────
export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-cream rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-charcoal mb-1">Mis Pedidos</h1>
        <p className="font-body text-sm text-charcoal-muted">
          {orders.length === 0
            ? "No tienes pedidos aún"
            : `${orders.length} pedido${orders.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm"
        >
          <ShoppingBag className="w-12 h-12 text-gold mx-auto mb-4" />
          <p className="font-display text-lg text-charcoal mb-2">
            Aún no has hecho ningún pedido
          </p>
          <p className="font-body text-sm text-charcoal-muted mb-6">
            Explora nuestros perfumes y encuentra tu fragancia ideal.
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body font-semibold text-sm hover:bg-gold transition-colors shadow-sm"
          >
            Explorar Catálogo
          </a>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-border rounded-xl p-4 hover:border-gold transition-all shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream border border-border shadow-sm flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-charcoal">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-body text-xs text-charcoal-muted">
                        {formatDate(order.created_at)}
                        {order.items
                          ? ` · ${order.items.length} item${order.items.length !== 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body border ${cfg.bg} ${cfg.color}`}
                    >
                      <cfg.Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <p className="font-display text-base text-gold">
                      {formatCOP(order.total)}
                    </p>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-border text-charcoal text-xs font-body hover:text-gold hover:border-gold transition-colors shadow-sm"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </section>
  );
}
