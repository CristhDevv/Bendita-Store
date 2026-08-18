import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Bendita Store
 *
 * Responsabilidades:
 * 1. Refrescar la sesión de Supabase en cada request (patrón oficial @supabase/ssr).
 * 2. Proteger rutas /admin/*: si no hay sesión → redirige a /login.
 *    La verificación de is_admin se hace en admin/layout.tsx (Server Component)
 *    para evitar una query de BD en cada request del middleware.
 * 3. Proteger rutas /account/*: si no hay sesión → redirige a /login.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay credenciales configuradas, no bloqueamos (ej. build time)
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANTE: No llamar a supabase.auth.getSession() — usar getUser() que
  // valida contra el servidor y no confía en el token local.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Proteger /admin/* — requiere sesión activa
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Proteger /account/* — requiere sesión activa
  if (pathname.startsWith("/account")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos de Next.js (_next/static, _next/image, favicon, etc.)
     * y archivos con extensiones de imagen/fuente para no penalizar el rendimiento.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
