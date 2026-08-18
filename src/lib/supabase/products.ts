import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

/**
 * getProductBySlug — Fetches a product by slug using the typed Supabase client.
 *
 * Previously there were two versions of this function:
 * - getProductBySlugPublic (raw fetch, duplicated logic)
 * - getProductBySlug (typed client, server-only)
 *
 * They have been consolidated into this single function. The `revalidate`
 * behaviour can be controlled via the `next` option on the client fetch
 * override (see usage in product/[slug]/page.tsx).
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient({
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, next: { revalidate: 86400 } }),
      },
    });
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brand:brands(*),
        category:categories(*)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("show_in_catalog", true)
      .single();

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        // PGRST116 = "no rows returned" — not an error we need to log
        console.error("Error fetching product by slug:", error);
      }
      return null;
    }

    return data as Product;
  } catch (err) {
    console.error("Failed to initialize Supabase in getProductBySlug:", err);
    return null;
  }
}

/**
 * @deprecated Use getProductBySlug instead.
 * Kept for backwards compatibility during migration.
 */
export const getProductBySlugPublic = getProductBySlug;

export async function getRelatedProducts(
  categoryId: string | undefined,
  excludeId: string
): Promise<Product[]> {
  try {
    const supabase = await createClient({
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, next: { revalidate: 3600 } }),
      },
    });

    // Guard: if Supabase is not configured, return empty array
    if (!supabase) return [];

    let query = supabase
      .from("products")
      .select(`*, brand:brands(*)`)
      .neq("id", excludeId)
      .eq("is_active", true)
      .eq("show_in_catalog", true)
      .gt("stock", 0)
      .limit(6);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data as Product[];
  } catch (err) {
    console.error("Failed to initialize Supabase in getRelatedProducts:", err);
    return [];
  }
}

export async function getProducts(filters?: {
  brand?: string;
  limit?: number;
}): Promise<Product[]> {
  try {
    const supabase = await createClient({
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, next: { revalidate: 3600 } }),
      },
    });
    if (!supabase) return [];

    let query = supabase
      .from("products")
      .select(`*, brand:brands(*)`)
      .eq("is_active", true)
      .gt("stock", 0);

    if (filters?.brand) {
      query = query.eq("brand_id", filters.brand);
    }

    const { data, error } = await query.limit(filters?.limit ?? 20);
    if (error) return [];
    return data as Product[];
  } catch (err) {
    console.error("Failed to initialize Supabase in getProducts:", err);
    return [];
  }
}

export async function getAllActiveProductSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    // Select updated_at (not created_at) for accurate sitemap lastModified dates
    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at, created_at")
      .eq("is_active", true)
      .eq("show_in_catalog", true)
      .gt("stock", 0);

    if (error || !data) return [];

    return data.map(
      (p: { slug: string; updated_at?: string; created_at: string }) => ({
        slug: p.slug,
        // Use updated_at if available; fall back to created_at for older rows
        updated_at: p.updated_at ?? p.created_at,
      })
    );
  } catch (err) {
    console.error("Failed in getAllActiveProductSlugs:", err);
    return [];
  }
}
