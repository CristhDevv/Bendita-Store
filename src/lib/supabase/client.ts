import { createBrowserClient } from "@supabase/ssr";

/**
 * createClient — Browser Supabase client
 *
 * Nota: No se usa singleton para evitar fuga de sesión entre usuarios
 * en entornos con SSR o caché de módulos (edge runtime).
 * El SDK de Supabase gestiona internamente la reconexión y el caché del token.
 */
export function createClient(): ReturnType<typeof createBrowserClient> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl.startsWith("http") || !supabaseKey) {
    console.warn("Supabase env vars missing — using dummy client");
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
