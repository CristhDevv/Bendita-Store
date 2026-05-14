import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient({
      global: { fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, next: { revalidate: 3600 } }) }
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
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
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

export async function getRelatedProducts(categoryId: string | undefined, excludeId: string): Promise<Product[]> {
  try {
    const supabase = await createClient({
      global: { fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, next: { revalidate: 3600 } }) }
    });
    
    let query = supabase
      .from("products")
      .select(`*, brand:brands(*)`)
      .neq("id", excludeId)
      .eq("is_active", true)
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

export async function getProducts(filters?: any): Promise<Product[]> {
  try {
    const supabase = await createClient({
      global: { fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, next: { revalidate: 3600 } }) }
    });
    let query = supabase.from("products").select(`*, brand:brands(*)`).eq("is_active", true);

    if (filters?.brand) {
      query = query.eq("brand_id", filters.brand);
    }

    const { data, error } = await query.limit(20);
    if (error) return [];
    return data as Product[];
  } catch (err) {
    console.error("Failed to initialize Supabase in getProducts:", err);
    return [];
  }
}

export async function getAllActiveProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select("slug, created_at")
      .eq("is_active", true);

    if (error || !data) return [];
    return data.map(p => ({
      slug: p.slug,
      updated_at: p.created_at
    }));
  } catch (err) {
    console.error("Failed in getAllActiveProductSlugs:", err);
    return [];
  }
}

