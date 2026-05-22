import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getProductBySlugPublic, getRelatedProducts } from "@/lib/supabase/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductCard } from "@/components/product/ProductCard";
import { CONFIG } from "@/lib/config";
import { formatPrice } from "@/lib/utils/format";

export const revalidate = 86400; // 24 hours

const BASE_URL = CONFIG.SITE.URL;
const STORAGE_URL = CONFIG.STORAGE.PUBLIC_URL;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let product = await getProductBySlugPublic(resolvedParams.slug);
  if (!product) return { title: "Producto no encontrado | Bendita Store" };
  
  if (!product) return { title: "Producto no encontrado | Bendita Store" };

  const fullTitle = `${product.name} - ${product.brand?.name} | Bendita Store`;
  const fullDesc = product.description || `Compra ${product.name} de ${product.brand?.name} en Bendita Store.`;
  const canonical = `${BASE_URL}/product/${product.slug}`;
  
  // Use first image or placeholder
  const ogImage = product.images?.[0]?.startsWith('http') 
    ? product.images[0] 
    : product.images?.[0] 
      ? `${STORAGE_URL}products/${product.images[0]}`
      : `${BASE_URL}/og-placeholder.png`;

  return {
    title: fullTitle,
    description: fullDesc,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description: fullDesc,
      url: canonical,
      images: [{ url: ogImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDesc,
      images: [ogImage],
    },
  };
}



export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let product = await getProductBySlugPublic(resolvedParams.slug);
  
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id);
  const discountPct = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `Compra ${product.name} de ${product.brand?.name} en Bendita Store.`,
    "image": product.images?.[0]?.startsWith('http') 
      ? product.images[0] 
      : product.images?.[0] 
        ? `${STORAGE_URL}products/${product.images[0]}`
        : `${BASE_URL}/og-placeholder.png`,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "COP",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `${BASE_URL}/product/${product.slug}`
    },
    "brand": {
      "@type": "Brand",
      "name": product.brand?.name || "Bendita Store"
    }
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Top Section */}
      <section className="container mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left: Gallery */}
          <div className="w-full lg:w-1/2">
            <ProductGallery images={product.images || []} />
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 font-body text-[10px] text-charcoal-muted mb-6 uppercase tracking-widest">
              <Link href="/" className="hover:text-gold transition-colors">Inicio</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-gold transition-colors">Catálogo</Link>
              <span>/</span>
              <Link href={`/products?brand=${product.brand?.name}`} className="hover:text-gold transition-colors">{product.brand?.name}</Link>
              <span>/</span>
              <span className="text-charcoal-muted/80 line-clamp-1">{product.name}</span>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.gender && (
                <span className="px-3 py-1 bg-cream border border-border rounded-full text-[10px] text-charcoal uppercase tracking-widest">
                  {product.gender === 'women' ? 'Mujer' : product.gender === 'men' ? 'Hombre' : 'Unisex'}
                </span>
              )}

            </div>

            {/* Title & Brand */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-charcoal leading-tight mb-2">
              {product.name}
            </h1>
            <p className="font-body text-lg text-gold-400 tracking-[0.2em] uppercase mb-6">
              {product.brand?.name}
            </p>

            {/* Rating */}
            <a href="#reviews" className="flex items-center gap-2 mb-8 group w-fit">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
              </div>
              <span className="font-body text-sm text-charcoal-muted group-hover:text-gold transition-colors underline underline-offset-4 decoration-border">
                (Leer reseñas)
              </span>
            </a>

            {/* Price */}
            <div className="flex items-end gap-4 mb-10">
              <span className="font-body font-bold text-4xl text-gold">
                ${formatPrice(product.price)}
              </span>
              {product.compare_price && (
                <div className="flex flex-col gap-1 pb-1">
                  <span className="font-body text-sm text-charcoal-muted/50 line-through">
                    ${formatPrice(product.compare_price)}
                  </span>
                  {discountPct && (
                    <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-2 py-0.5 rounded border border-rose-500/20">
                      Ahorras {discountPct}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions (Client Component) */}
            <ProductActions product={product} />

            {/* Accordions (Client Component) */}
            <ProductAccordions description={product.description} />

          </div>
        </div>
      </section>

      {/* Reviews (Mock empty array for now since we don't fetch reviews yet) */}
      <ProductReviews reviews={[]} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="py-20 bg-cream border-t border-border">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="font-display text-3xl text-charcoal mb-12 text-center">También te puede gustar</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {related.map(p => (
                <div key={p.id} className="snap-start shrink-0 w-[280px] md:w-[320px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
