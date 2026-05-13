"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Lock, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateProfile, updatePassword } from "@/lib/supabase/account";
import type { Profile } from "@/types";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-navy-900/60 border border-gold-500/20 focus:border-gold-500/60 text-crystal font-body text-sm outline-none transition-colors placeholder:text-crystal/30";

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
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const displayInitial = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-crystal mb-1">Datos Personales</h1>
        <p className="font-body text-sm text-crystal/50">
          Actualiza tu información personal y contraseña.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-display font-bold text-2xl select-none">
          {displayInitial}
        </div>
        <div>
          <p className="font-body text-sm font-medium text-crystal">
            {fullName || user?.email}
          </p>
          <p className="font-body text-xs text-crystal/50">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="glass border border-gold-500/10 rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gold" />
          <h2 className="font-body text-sm font-medium text-crystal uppercase tracking-widest">
            Información Personal
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-crystal/50 mb-1.5">
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
            <label className="block font-body text-xs text-crystal/50 mb-1.5">
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
          <label className="block font-body text-xs text-crystal/50 mb-1.5">
            Correo electrónico
          </label>
          <input
            className={`${inputClass} opacity-50 cursor-not-allowed`}
            value={user?.email || ""}
            readOnly
          />
          <p className="font-body text-[11px] text-crystal/30 mt-1">
            El email no puede cambiarse desde aquí.
          </p>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-xl font-body font-semibold text-sm transition-colors disabled:opacity-60"
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
        className="glass border border-gold-500/10 rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gold" />
          <h2 className="font-body text-sm font-medium text-crystal uppercase tracking-widest">
            Cambiar Contraseña
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-crystal/50 mb-1.5">
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
            <label className="block font-body text-xs text-crystal/50 mb-1.5">
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
          className="flex items-center gap-2 px-6 py-3 bg-gold-500/15 border border-gold-500/30 text-gold rounded-xl font-body font-semibold text-sm hover:bg-gold-500/25 transition-colors disabled:opacity-40"
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
