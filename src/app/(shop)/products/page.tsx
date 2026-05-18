import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import { ProductsCatalog } from "@/components/product/ProductsCatalog";

export const metadata = {
  title: "Catálogo de Fragancias Premium",
  description: "Explora nuestra colección completa de perfumes premium. Filtra por familia olfativa, marca y precio. Envío a toda Colombia.",
};

async function fetchProductsSSR(): Promise<Product[]> {
  try {
    const supabase = await createClient({
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, next: { revalidate: 3600 } }),
      },
    });
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*, brand:brands(*), category:categories(*)")
      .eq("is_active", true);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await fetchProductsSSR();

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 md:px-8 py-10">
          Cargando catálogo...
        </div>
      }
    >
      <ProductsCatalog initialProducts={products} />
    </Suspense>
  );
}
