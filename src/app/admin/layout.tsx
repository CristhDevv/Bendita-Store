import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLayoutClient } from "./_components/AdminLayoutClient";

/**
 * AdminLayout — Server Component
 *
 * Runs on the server before any client code is executed:
 * 1. Verifica que haya una sesión activa (el middleware ya redirige si no hay,
 *    pero esta verificación doble garantiza la integridad en SSR).
 * 2. Verifica que el usuario tenga is_admin = true en la tabla profiles.
 * 3. Si cualquiera de las condiciones falla, redirige inmediatamente —
 *    el cliente nunca ve el HTML del dashboard admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profile = data as { is_admin: boolean } | null;

  if (!profile?.is_admin) {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
