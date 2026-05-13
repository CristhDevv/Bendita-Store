"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Pencil, Trash2, Star, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserAddresses,
  upsertAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/supabase/account";
import type { Address } from "@/types";

import dynamic from "next/dynamic";

const AddressModal = dynamic(() => import("./AddressModal").then((mod) => mod.AddressModal), { ssr: false });

// ─── Addresses Page ────────────────────────────────────────────
export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserAddresses(user.id)
      .then(setAddresses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = (saved: Address) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta dirección?")) return;
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Dirección eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      await setDefaultAddress(user.id, id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      toast.success("Dirección principal actualizada");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-crystal mb-1">Mis Direcciones</h1>
          <p className="font-body text-sm text-crystal/50">
            {addresses.length === 0
              ? "No tienes direcciones guardadas"
              : `${addresses.length} dirección${addresses.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAddress(undefined);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-xl font-body font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-gold-500/10 rounded-2xl p-12 text-center"
        >
          <MapPin className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <p className="font-display text-lg text-crystal mb-2">
            Sin direcciones guardadas
          </p>
          <p className="font-body text-sm text-crystal/50 mb-6">
            Agrega una dirección para agilizar tus compras futuras.
          </p>
          <button
            onClick={() => {
              setEditingAddress(undefined);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-xl font-body font-semibold text-sm hover:bg-gold-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar Dirección
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr, i) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass border rounded-xl p-4 transition-all ${
                addr.is_default
                  ? "border-gold-500/40"
                  : "border-gold-500/10 hover:border-gold-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {addr.label && (
                        <span className="font-body text-sm font-medium text-crystal">
                          {addr.label}
                        </span>
                      )}
                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-500/15 border border-gold-500/30 text-gold text-[10px] font-body rounded-full">
                          <Star className="w-2.5 h-2.5" /> Principal
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-crystal/70">
                      {addr.street}
                    </p>
                    <p className="font-body text-xs text-crystal/50">
                      {[addr.city, addr.state, addr.country]
                        .filter(Boolean)
                        .join(", ")}
                      {addr.postal_code ? ` · ${addr.postal_code}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="px-2 py-1.5 rounded-lg text-crystal/40 hover:text-gold text-xs font-body transition-colors"
                      title="Marcar como principal"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingAddress(addr);
                      setShowModal(true);
                    }}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-crystal/40 hover:text-crystal transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-crystal/40 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === addr.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddressModal
            address={editingAddress}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
