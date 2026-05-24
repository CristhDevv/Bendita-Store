import { HeroSection } from "@/components/home/HeroSection";
import { CategoryBanner } from "@/components/home/CategoryBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { PromoSection } from "@/components/home/PromoSection";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import type { Product } from "@/types";

export const metadata = {
  title: "Perfumería Premium — Fragancias Exclusivas",
  description: "Tienda de perfumes premium en Colombia. Encuentra las mejores fragancias del mundo con envío a todo el país. Baccarat Rouge 540, Creed Aventus, Tom Ford y más.",
};

async function getDiscountProducts(): Promise<Product[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return MOCK_PRODUCTS.filter(
      (p) => p.compare_price && p.compare_price > p.price
    ).slice(0, 5);
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=*,brand:brands(*),category:categories(*)`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data: Product[] = await res.json();
    const discountProducts = data
      .filter((p) => p.compare_price && Number(p.compare_price) > Number(p.price))
      .slice(0, 5);

    if (discountProducts.length === 0) {
      return MOCK_PRODUCTS.filter(
        (p) => p.compare_price && p.compare_price > p.price
      ).slice(0, 5);
    }

    return discountProducts;
  } catch (error) {
    console.error("Error fetching discount products from Supabase:", error);
    return MOCK_PRODUCTS.filter(
      (p) => p.compare_price && p.compare_price > p.price
    ).slice(0, 5);
  }
}

export default async function HomePage() {
  const discountProducts = await getDiscountProducts();

  return (
    <div className="overflow-x-hidden">
      <HeroSection discountProducts={discountProducts} />
      <CategoryBanner />
      <FeaturedProducts />
      <BrandShowcase />
      <PromoSection />
    </div>
  );
}
