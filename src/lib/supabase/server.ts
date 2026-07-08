import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type ServerClientOptions = Omit<Parameters<typeof createServerClient>[2], "cookies">;

export async function createClient(
  customOptions?: ServerClientOptions
): Promise<ReturnType<typeof createServerClient> | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("http") || !supabaseKey) {
    console.warn("[supabase/server] env vars missing or invalid — returning null client");
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
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
