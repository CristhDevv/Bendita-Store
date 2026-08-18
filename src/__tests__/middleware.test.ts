import { describe, it, expect, vi, beforeEach } from "vitest";
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
function makeRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    method: "GET",
    headers: { cookie: "" },
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
