"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Bell, X, ExternalLink } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

interface NotificationData {
  orderId: string;
  status: string;
}

export function OrderChangeNotification() {
  const { user, loading } = useAuth();
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    const supabase = createClient();
    if (!supabase) return;

    // Suscribirse a cambios en tiempo real en la tabla orders para el usuario actual
    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const oldData = payload.old as { status?: string };
          const newData = payload.new as { id: string; status: string };

          // Mostrar notificación únicamente si el estado cambió
          if (oldData && oldData.status !== newData.status) {
            setNotification({
              orderId: newData.id,
              status: newData.status,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading]);

  // Manejar el auto-dismiss de 10 segundos
  useEffect(() => {
    if (notification) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setNotification(null);
      }, 10000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification]);

  if (!notification) return null;

  const friendlyStatus = STATUS_LABELS[notification.status] || notification.status;
  const shortId = notification.orderId.slice(0, 8).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes slideDownBanner {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes ringSlow {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(10deg); }
          75%      { transform: rotate(-10deg); }
        }
        @keyframes shimmerTextGold {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .order-notification-banner {
          animation: slideDownBanner 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .order-notification-banner:hover .bell-icon {
          animation: ringSlow 0.5s ease infinite;
        }
        .shimmer-gold {
          background: linear-gradient(
            90deg,
            #B8960C 0%,
            #F5D06B 40%,
            #B8960C 60%,
            #F5D06B 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerTextGold 3s linear infinite;
        }
      `}</style>

      <div
        role="alert"
        aria-live="assertive"
        className="order-notification-banner fixed top-0 left-0 right-0 z-[9999]"
        style={{
          background: "linear-gradient(135deg, #0D0D0D 0%, #1A1410 50%, #0D0D0D 100%)",
          borderBottom: "1px solid rgba(184, 150, 12, 0.4)",
          boxShadow: "0 4px 30px rgba(184, 150, 12, 0.15), 0 1px 0 rgba(184, 150, 12, 0.3)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Icono + Texto */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(184, 150, 12, 0.15)",
                border: "1px solid rgba(184, 150, 12, 0.4)",
              }}
            >
              <Bell size={15} className="bell-icon" style={{ color: "#B8960C" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white leading-tight">
                ¡Tu pedido <span className="shimmer-gold font-semibold">#{shortId}</span> cambió de estado!
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5 truncate">
                Estado actual del pedido: <span className="font-semibold text-gold capitalize">{friendlyStatus}</span>
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/account/orders/${notification.orderId}`}
              onClick={() => setNotification(null)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #B8960C, #D4A910)",
                color: "#0D0D0D",
                boxShadow: "0 2px 12px rgba(184, 150, 12, 0.3)",
              }}
            >
              Ver pedido
              <ExternalLink size={12} />
            </Link>

            <button
              onClick={() => setNotification(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/5"
              style={{ color: "#666" }}
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
