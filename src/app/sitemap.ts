import { MetadataRoute } from 'next'
import { CONFIG } from '@/lib/config'
 
const BASE_URL = CONFIG.SITE.URL
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = [
    '',
    '/products',
    '/register',
    '/login',
    '/forgot-password',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  // Dynamic product routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let productSlugs: { slug: string; updated_at: string }[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?select=slug,created_at&is_active=eq.true`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const data = await res.json();
        productSlugs = data.map((p: any) => ({
          slug: p.slug,
          updated_at: p.created_at
        }));
      }
    } catch (err) {
      console.error("Sitemap error fetching products:", err);
    }
  }

  const productRoutes = productSlugs.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
 
  return [...routes, ...productRoutes]
}
