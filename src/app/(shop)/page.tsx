import { HeroSection } from "@/components/home/HeroSection";
import { CategoryBanner } from "@/components/home/CategoryBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { PromoSection } from "@/components/home/PromoSection";

export const metadata = {
  title: "Bendita Store | Perfumería Premium",
  description:
    "Descubre fragancias exclusivas de las mejores casas de perfumería del mundo en Bendita Store. Envíos a toda Colombia con la mejor selección de perfumes de lujo.",
  alternates: {
    canonical: "/",
  },
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
