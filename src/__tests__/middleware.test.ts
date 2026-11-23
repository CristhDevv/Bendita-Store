import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock @supabase/ssr ────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

// ─── Import middleware after mocking ──────────────────────────────────────────
// Use relative path since middleware.ts is at project root, outside src/
const { middleware } = await import("../../middleware");

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(
  pathname: string,
  options?: { headers?: Record<string, string>; ip?: string }
): NextRequest {
  const headers: Record<string, string> = {
    cookie: "",
    ...(options?.headers || {}),
  };
  if (options?.ip) {
    headers["x-forwarded-for"] = options.ip;
  }
  return new NextRequest(`http://localhost${pathname}`, {
    method: "GET",
    headers,
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("Admin/Account Route Protection Middleware", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("redirects to /login for /admin/* when no user session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = makeRequest("/admin");
    const response = await middleware(request);

    expect(response.status).toBe(307); // redirect
    expect(response.headers.get("location")).toContain("/login");
  });

  it("includes the original path in ?next= param on redirect", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = makeRequest("/admin/orders");
    const response = await middleware(request);

    expect(response.headers.get("location")).toContain("next=%2Fadmin%2Forders");
  });

  it("allows /admin/* access when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@example.com" } },
      error: null,
    });

    const request = makeRequest("/admin");
    const response = await middleware(request);

    // Should NOT be a redirect (status 200 or no redirect)
    expect(response.status).not.toBe(307);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects to /login for /account/* when no user session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = makeRequest("/account/orders");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows /account/* access when user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });

    const request = makeRequest("/account/orders");
    const response = await middleware(request);

    expect(response.status).not.toBe(307);
  });

  it("allows public routes without authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const publicRoutes = ["/", "/products", "/product/some-slug", "/login", "/register"];
    for (const route of publicRoutes) {
      const request = makeRequest(route);
      const response = await middleware(request);
      expect(response.status, `Route '${route}' should be accessible`).not.toBe(307);
    }
  });

  it("passes through when Supabase env vars are missing (build time safety)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const request = makeRequest("/admin");
    // Should not throw — should pass through without redirect
    const response = await middleware(request);
    expect(response).toBeDefined();
  });
});

describe("Security Perimeter Hardening in Middleware", () => {
  it("blocks malicious scanner user-agents with 403 Forbidden", async () => {
    const maliciousAgents = [
      "sqlmap/1.5.2#stable",
      "Mozilla/5.0 (compatible; Nikto/2.1.6)",
      "masscan/1.0",
      "Acunetix Web Vulnerability Scanner",
      "gobuster/3.1.0",
      "Wget/1.20 (wpscan)",
    ];

    for (const agent of maliciousAgents) {
      const request = makeRequest("/", {
        headers: { "user-agent": agent },
      });
      const response = await middleware(request);
      expect(response.status, `User-Agent '${agent}' should be blocked`).toBe(403);
    }
  });

  it("blocks sensitive path scans and path traversal attempts with 404 Not Found", async () => {
    const suspiciousPaths = [
      "/.env",
      "/.env.local",
      "/.git/config",
      "/.aws/credentials",
      "/wp-admin/install.php",
      "/index.php",
      "/actuator/health",
      "/phpmyadmin",
    ];

    for (const path of suspiciousPaths) {
      const request = makeRequest(path);
      const response = await middleware(request);
      expect(response.status, `Path '${path}' should be rejected`).toBe(404);
    }
  });

  it("enforces rate limits on sensitive /api/notify-order endpoint", async () => {
    const ip = "192.168.100.50";
    let lastResponse;

    // Send 10 requests (allowed threshold)
    for (let i = 0; i < 10; i++) {
      const request = makeRequest("/api/notify-order", { ip });
      lastResponse = await middleware(request);
      expect(lastResponse.status).not.toBe(429);
    }

    // 11th request should exceed the limit and receive 429
    const exceededRequest = makeRequest("/api/notify-order", { ip });
    const blockedResponse = await middleware(exceededRequest);
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get("retry-after")).toBe("60");
  });
});
