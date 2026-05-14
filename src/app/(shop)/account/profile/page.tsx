"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Lock, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateProfile, updatePassword } from "@/lib/supabase/account";
import type { Profile } from "@/types";

  "w-full px-4 py-3 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.id)
      .then((p) => {
        setProfile(p);
        setFullName(p?.full_name || user.user_metadata?.full_name || "");
        setPhone(p?.phone || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const updated = await updateProfile(user.id, {
        full_name: fullName,
        phone,
      });
      setProfile(updated);
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada");
    } catch {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-cream rounded-lg animate-pulse" />
        <div className="h-64 bg-cream rounded-xl animate-pulse" />
        <div className="h-48 bg-cream rounded-xl animate-pulse" />
      </div>
    );
  }

  const displayInitial = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-charcoal mb-1">Datos Personales</h1>
        <p className="font-body text-sm text-charcoal-muted">
          Actualiza tu información personal y contraseña.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-white font-display font-bold text-2xl select-none">
          {displayInitial}
        </div>
        <div>
          <p className="font-body text-sm font-medium text-charcoal">
            {fullName || user?.email}
          </p>
          <p className="font-body text-xs text-charcoal-muted">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gold" />
          <h2 className="font-body text-sm font-medium text-charcoal uppercase tracking-widest">
            Información Personal
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">
              Nombre completo
            </label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">
              Teléfono
            </label>
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-xs text-charcoal-muted mb-1.5">
            Correo electrónico
          </label>
          <input
            className={`${inputClass} opacity-50 cursor-not-allowed`}
            value={user?.email || ""}
            readOnly
          />
          <p className="font-body text-[11px] text-charcoal-muted mt-1">
            El email no puede cambiarse desde aquí.
          </p>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="flex items-center gap-2 px-6 py-3 bg-charcoal hover:bg-gold text-white rounded-xl font-body font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {savingProfile ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {savingProfile ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {/* Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gold" />
          <h2 className="font-body text-sm font-medium text-charcoal uppercase tracking-widest">
            Cambiar Contraseña
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">
              Nueva contraseña
            </label>
            <input
              className={inputClass}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">
              Confirmar contraseña
            </label>
            <input
              className={inputClass}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword || !newPassword}
          className="flex items-center gap-2 px-6 py-3 bg-cream border border-border text-charcoal rounded-xl font-body font-semibold text-sm hover:bg-gold hover:text-white hover:border-gold transition-colors disabled:opacity-40"
        >
          {savingPassword ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {savingPassword ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>
    </section>
  );
}
