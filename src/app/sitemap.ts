import { MetadataRoute } from 'next'
import { getAllActiveProductSlugs } from '@/lib/supabase/products'
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
  const productSlugs = await getAllActiveProductSlugs()
  const productRoutes = productSlugs.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
 
  return [...routes, ...productRoutes]
}
