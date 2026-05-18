import { HeroSection } from "@/components/home/HeroSection";
import { CategoryBanner } from "@/components/home/CategoryBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { PromoSection } from "@/components/home/PromoSection";

export const metadata = {
  title: "Perfumería Premium — Fragancias Exclusivas",
  description: "Tienda de perfumes premium en Colombia. Encuentra las mejores fragancias del mundo con envío a todo el país. Baccarat Rouge 540, Creed Aventus, Tom Ford y más.",
};

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <CategoryBanner />
      <FeaturedProducts />
      <BrandShowcase />
      <PromoSection />
    </div>
  );
}
