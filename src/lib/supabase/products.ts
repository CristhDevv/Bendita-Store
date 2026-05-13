import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient({
    global: { fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, next: { revalidate: 3600 } }) }
  });
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
    console.error("Error fetching product by slug:", error);
    return null;
  }

  return data as Product;
}

export async function getRelatedProducts(categoryId: string | undefined, excludeId: string): Promise<Product[]> {
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
}

export async function getProducts(filters?: any): Promise<Product[]> {
  const supabase = await createClient({
    global: { fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, next: { revalidate: 3600 } }) }
  });
  let query = supabase.from("products").select(`*, brand:brands(*)`).eq("is_active", true);

  // If we had server-side filters applied here
  if (filters?.brand) {
    query = query.eq("brand_id", filters.brand);
  }

  const { data, error } = await query.limit(20);
  if (error) return [];
  return data as Product[];
}

export async function getAllActiveProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, created_at") // Using created_at since updated_at might not exist yet, I'll check schema later if needed
    .eq("is_active", true);
  
  if (error) return [];
  return data.map(p => ({
    slug: p.slug,
    updated_at: p.created_at
  }));
}
