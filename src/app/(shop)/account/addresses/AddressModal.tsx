import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { upsertAddress } from "@/lib/supabase/account";
import type { Address } from "@/types";

export function AddressModal({
  address,
  onClose,
  onSave,
}: {
  address?: Address;
  onClose: () => void;
  onSave: (a: Address) => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: address?.label || "",
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    postal_code: address?.postal_code || "",
    country: address?.country || "Colombia",
    is_default: address?.is_default || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const saved = await upsertAddress(user.id, {
        ...form,
        ...(address ? { id: address.id } : {}),
      });
      onSave(saved);
      toast.success(address ? "Dirección actualizada" : "Dirección guardada");
      onClose();
    } catch {
      toast.error("Error al guardar la dirección");
    } finally {
      setSaving(false);
    }
  };

    "w-full px-4 py-3 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white border border-border rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-charcoal">
            {address ? "Editar Dirección" : "Nueva Dirección"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="Etiqueta (Casa, Oficina...)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Calle / Carrera / Avenida *"
            required
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              placeholder="Ciudad *"
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Departamento"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              placeholder="Código postal"
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="País"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                form.is_default
                  ? "bg-gold border-gold text-white"
                  : "border-border"
              }`}
              onClick={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
            >
              {form.is_default && (
                <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="currentColor">
                  <path d="M1 4l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </div>
            <span className="font-body text-sm text-charcoal-muted">
              Marcar como dirección principal
            </span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Guardando..." : "Guardar Dirección"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
