"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, Mail, Calendar, UserCheck, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import toast from "react-hot-toast";

interface UserWithEmail extends Profile {
  email?: string;
  is_admin?: boolean;
  orders_count?: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    // Get profiles with order count
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as UserWithEmail[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleAdmin = async (user: UserWithEmail) => {
    setTogglingId(user.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !user.is_admin })
      .eq("id", user.id);
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
      toast.success(user.is_admin ? "Rol de admin removido" : "Rol de admin asignado");
    } else {
      toast.error("Error al actualizar");
    }
    setTogglingId(null);
    setConfirmId(null);
  };

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Usuarios</h1>
        <p className="font-body text-sm text-charcoal-muted">{users.length} clientes registrados</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Clientes", value: users.length, icon: Users, color: "text-blue-400" },
          { label: "Administradores", value: users.filter((u) => u.is_admin).length, icon: Shield, color: "text-gold" },
          { label: "Este mes", value: users.filter((u) => new Date(u.created_at) >= new Date(new Date().setDate(1))).length, icon: Calendar, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-border shadow-sm rounded-xl p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-cream border border-border flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-display text-xl text-charcoal font-semibold">{value}</p>
              <p className="font-body text-xs text-charcoal-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted shadow-sm"
          placeholder="Buscar por nombre, teléfono o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col divide-y divide-border">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-cream/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-gold font-display font-bold text-sm shrink-0">
                  {(user.full_name || "?").charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-charcoal font-medium truncate">
                    {user.full_name || <span className="text-charcoal-muted italic">Sin nombre</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {user.phone ? (
                      <div className="flex items-center gap-1 text-charcoal-muted">
                        <Mail className="w-3 h-3" />
                        <span className="font-body text-xs truncate">{user.phone}</span>
                      </div>
                    ) : (
                      <span className="font-body text-xs text-charcoal-muted">—</span>
                    )}
                    <span className="text-border">•</span>
                    <span className="font-body text-xs text-charcoal-muted truncate">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {user.is_admin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-body border text-gold border-gold/20 bg-gold/5">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-body border text-charcoal-muted border-border bg-cream">
                      Cliente
                    </span>
                  )}
                  
                  {confirmId === user.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleToggleAdmin(user)} disabled={togglingId === user.id} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-body transition-colors disabled:opacity-50">
                        {togglingId === user.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmId(null)} disabled={togglingId === user.id} className="bg-cream hover:bg-border border border-border rounded-lg px-2.5 py-1.5 text-charcoal text-xs font-body transition-colors disabled:opacity-50">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(user.id)}
                      className={`w-8 h-8 rounded-lg hover:bg-cream-dark flex items-center justify-center transition-colors ${
                        user.is_admin ? "text-gold hover:text-amber-300" : "text-charcoal-muted hover:text-gold"
                      }`}
                      title={user.is_admin ? "Quitar admin" : "Hacer admin"}
                    >
                      {user.is_admin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                <p className="font-body text-sm text-charcoal-muted">Sin resultados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
