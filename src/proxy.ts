import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: Request) {
  const req = request as any;
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const isProtectedRoute = 
    url.pathname.startsWith("/account") ||
    url.pathname.startsWith("/admin");

  // Redirigir a login si intenta acceder a una ruta protegida sin sesión
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL(url.href);
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir a account si intenta acceder a auth con sesión
  const isAuthRoute = 
    url.pathname.startsWith("/login") || 
    url.pathname.startsWith("/register") ||
    url.pathname.startsWith("/forgot-password");

  if (user && isAuthRoute) {
    const redirectUrl = new URL(url.href);
    redirectUrl.pathname = "/account";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
