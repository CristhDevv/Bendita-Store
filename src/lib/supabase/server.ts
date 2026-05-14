import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient(customOptions?: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("http") || !supabaseKey) {
    console.warn("[supabase/server] env vars missing or invalid — returning null client");
    return null as any;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignorar cookies en RSC
          }
        },
      },
      ...customOptions,
    }
  );
}
