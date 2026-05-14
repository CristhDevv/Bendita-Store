import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL inválida: "${supabaseUrl}"`);
  }

  if (!supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
