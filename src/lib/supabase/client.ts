import { createBrowserClient } from "@supabase/ssr";

let supabase: ReturnType<typeof createBrowserClient> | null = null;

export function createClient(): ReturnType<typeof createBrowserClient> | null {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl.startsWith("http") || !supabaseKey) {
    console.warn("Supabase env vars missing — using dummy client");
    return null;
  }

  supabase = createBrowserClient(supabaseUrl, supabaseKey);
  return supabase;
}
