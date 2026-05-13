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
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white/5 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-crystal mb-1">Mis Pedidos</h1>
        <p className="font-body text-sm text-crystal/50">
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
          className="glass border border-gold-500/10 rounded-2xl p-12 text-center"
        >
          <ShoppingBag className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <p className="font-display text-lg text-crystal mb-2">
            Aún no has hecho ningún pedido
          </p>
          <p className="font-body text-sm text-crystal/50 mb-6">
            Explora nuestros perfumes y encuentra tu fragancia ideal.
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-xl font-body font-semibold text-sm hover:bg-gold-400 transition-colors"
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
                className="glass border border-gold-500/10 rounded-xl p-4 hover:border-gold-500/25 transition-all"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-crystal">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-body text-xs text-crystal/50">
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
                      className="px-3 py-1.5 rounded-lg glass border border-gold-500/25 text-gold text-xs font-body hover:bg-gold-500/10 transition-colors"
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
