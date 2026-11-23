import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Bendita Store (Hardened)
 *
 * Responsabilidades:
 * 1. Filtrado perimetral contra bots de escaneo malicioso (User-Agent).
 * 2. Bloqueo inmediato de sondas de path traversal y archivos sensibles (.env, .git, etc.).
 * 3. Rate limiting perimetral para endpoints API (/api/* y /api/notify-order).
 * 4. Refrescar la sesión de Supabase en cada request (patrón oficial @supabase/ssr).
 * 5. Proteger rutas /admin/* y /account/*: si no hay sesión → redirige a /login.
 */

// ─── 1. Reglas de Detección de Bots y Scanners Maliciosos ──────────────────────
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /acunetix/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /nmap/i,
  /zgrab/i,
  /censys/i,
];

// ─── 2. Sondas de Archivos Sensibles y Path Traversal ─────────────────────────
const SUSPICIOUS_PATH_PATTERNS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/\.aws/i,
  /\/\.vscode/i,
  /\/\.ssh/i,
  /\.php$/i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/wp-content/i,
  /\/cgi-bin/i,
  /\.\.\//, // Path traversal ../
  /\/actuator/i,
  /\/phpmyadmin/i,
];

// ─── 3. In-Memory Sliding Window Rate Limiter ─────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    if (rateLimitMap.size > 2000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetTime) rateLimitMap.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

// ─── Middleware Handler Principal ─────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const clientIp = getClientIp(request);

  // 1. Bloqueo de herramientas automatizadas de escaneo malicioso
  if (userAgent && BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse(
      JSON.stringify({ error: "Access denied by security policy" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Bloqueo de path traversal y escaneos a rutas sensibles
  if (SUSPICIOUS_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3. Rate Limiting perimetral para endpoints de API
  if (pathname.startsWith("/api/")) {
    const isNotifyOrder = pathname.startsWith("/api/notify-order");
    const limit = isNotifyOrder ? 10 : 60; // 10 req/min para notificaciones, 60 req/min para APIs generales
    const windowMs = 60 * 1000;
    const rateLimitKey = `${clientIp}:${isNotifyOrder ? "notify" : "api"}`;

    if (!checkRateLimit(rateLimitKey, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({ error: "Demasiadas solicitudes. Por favor intente más tarde." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

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

  // Validar sesión contra el servidor (getUser)
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
