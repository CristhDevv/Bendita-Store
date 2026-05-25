"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { upsertAddress } from "@/lib/supabase/account";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm";

export default function NewAddressPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Colombia",
    is_default: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await upsertAddress(user.id, form);
      toast.success("Dirección guardada");
      router.push("/account/addresses");
    } catch {
      toast.error("Error al guardar la dirección");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/account/addresses"
        className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a mis direcciones
      </Link>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cream border border-border flex items-center justify-center">
            <MapPin className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl text-charcoal">Nueva Dirección</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className={inputClass} placeholder="Etiqueta (Casa, Oficina...)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input className={inputClass} placeholder="Calle / Carrera / Avenida *" required value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Ciudad *" required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <input className={inputClass} placeholder="Departamento" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Código postal" value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} />
            <input className={inputClass} placeholder="País" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${form.is_default ? "bg-gold border-gold text-white" : "border-border"}`}
              onClick={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
            >
              {form.is_default && <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="currentColor"><path d="M1 4l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>}
            </div>
            <span className="font-body text-sm text-charcoal-muted">Marcar como dirección principal</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Link href="/account/addresses" className="flex-1 py-3 rounded-xl bg-cream border border-border font-body text-sm text-charcoal-muted hover:text-charcoal transition-colors text-center shadow-sm">Cancelar</Link>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors disabled:opacity-60 shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Guardando..." : "Guardar Dirección"}
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  );
}
