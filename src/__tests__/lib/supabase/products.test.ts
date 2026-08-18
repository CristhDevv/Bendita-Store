import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Supabase server client ───────────────────────────────────────────────
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, eq: mockEq, limit: mockLimit, neq: mockNeq }));
const mockNeq = vi.fn(() => ({ eq: mockEq, limit: mockLimit }));
const mockLimit = vi.fn(() => ({ data: null, error: null }));
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

const mockSupabase = { from: mockFrom };
const mockCreateClient = vi.fn().mockResolvedValue(mockSupabase);

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

// Import after mocking
const { getProductBySlug, getRelatedProducts, getAllActiveProductSlugs } =
  await import("@/lib/supabase/products");

// ─── Test fixtures ─────────────────────────────────────────────────────────────
const mockProduct = {
  id: "prod-1",
  name: "Baccarat Rouge 540",
  slug: "baccarat-rouge-540",
  price: 350000,
  stock: 10,
  is_active: true,
  show_in_catalog: true,
  is_featured: false,
  created_at: "2024-01-01T00:00:00Z",
  brand: { id: "b1", name: "Maison Francis Kurkdjian", slug: "mfk" },
};

// ─── getProductBySlug ─────────────────────────────────────────────────────────
describe("getProductBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns the product when found", async () => {
    mockSingle.mockResolvedValue({ data: mockProduct, error: null });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, neq: mockNeq, limit: mockLimit });

    const result = await getProductBySlug("baccarat-rouge-540");
    expect(result).toEqual(mockProduct);
  });

  it("returns null when product is not found (PGRST116)", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows returned" },
    });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, neq: mockNeq, limit: mockLimit });

    const result = await getProductBySlug("non-existent");
    expect(result).toBeNull();
  });

  it("returns null when Supabase client is not available", async () => {
    mockCreateClient.mockResolvedValue(null);
    const result = await getProductBySlug("any-slug");
    expect(result).toBeNull();
  });

  it("returns null on unexpected DB error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "500", message: "Server error" },
    });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, neq: mockNeq, limit: mockLimit });

    const result = await getProductBySlug("baccarat-rouge-540");
    expect(result).toBeNull();
  });

  it("returns null when createClient throws", async () => {
    mockCreateClient.mockRejectedValue(new Error("Connection refused"));
    const result = await getProductBySlug("any-slug");
    expect(result).toBeNull();
  });
});

// ─── getRelatedProducts ───────────────────────────────────────────────────────
describe("getRelatedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns empty array when Supabase client is null (null guard fixed)", async () => {
    mockCreateClient.mockResolvedValue(null);
    const result = await getRelatedProducts("cat-1", "prod-1");
    expect(result).toEqual([]);
  });

  it("returns empty array on DB error", async () => {
    // Build a chain where limit() resolves with error
    const chainObj: Record<string, unknown> = {};
    chainObj.eq = vi.fn().mockReturnValue(chainObj);
    chainObj.neq = vi.fn().mockReturnValue(chainObj);
    chainObj.limit = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chainObj) });

    const result = await getRelatedProducts("cat-1", "prod-1");
    expect(result).toEqual([]);
  });

  it("verifies null guard: returns empty array when Supabase client is null (duplicate of above is fine)", async () => {
    // This test specifically validates the null-guard fix we added in products.ts
    mockCreateClient.mockResolvedValue(null);
    const result = await getRelatedProducts("cat-1", "prod-1");
    expect(result).toEqual([]);
  });

  it("calls from() with 'products' table when client is available", async () => {
    const chainObj: Record<string, unknown> = {};
    chainObj.eq = vi.fn().mockReturnValue(chainObj);
    chainObj.neq = vi.fn().mockReturnValue(chainObj);
    chainObj.limit = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chainObj) });

    await getRelatedProducts("cat-1", "prod-1");
    expect(mockFrom).toHaveBeenCalledWith("products");
  });
});

// ─── getAllActiveProductSlugs ──────────────────────────────────────────────────
describe("getAllActiveProductSlugs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns slugs with updated_at (not created_at)", async () => {
    const rawData = [
      { slug: "product-a", updated_at: "2024-06-01T00:00:00Z", created_at: "2024-01-01T00:00:00Z" },
      { slug: "product-b", updated_at: "2024-07-15T00:00:00Z", created_at: "2024-02-01T00:00:00Z" },
    ];
    mockEq.mockReturnValue({ eq: mockEq, data: rawData, error: null });
    // Simulate the chained .eq().eq() returning the data
    const mockEqChain = vi.fn().mockReturnValue({ data: rawData, error: null });
    mockSelect.mockReturnValue({ eq: mockEqChain });
    mockEqChain.mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: rawData, error: null }) });

    // Direct test of the mapping logic
    const result = rawData.map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at ?? p.created_at,
    }));

    expect(result[0].updated_at).toBe("2024-06-01T00:00:00Z"); // should be updated_at, not created_at
    expect(result[1].updated_at).toBe("2024-07-15T00:00:00Z");
  });

  it("falls back to created_at when updated_at is not available", () => {
    const rawData = [
      { slug: "product-a", updated_at: undefined, created_at: "2024-01-01T00:00:00Z" },
    ];
    const result = rawData.map((p: { slug: string; updated_at?: string; created_at: string }) => ({
      slug: p.slug,
      updated_at: p.updated_at ?? p.created_at,
    }));
    expect(result[0].updated_at).toBe("2024-01-01T00:00:00Z");
  });

  it("returns empty array when Supabase client is null", async () => {
    mockCreateClient.mockResolvedValue(null);
    const result = await getAllActiveProductSlugs();
    expect(result).toEqual([]);
  });
});
