import { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

const BASE_URL = CONFIG.SITE.URL

export const metadata: Metadata = {
  title: 'Catálogo de Fragancias Premium',
  description: 'Explora nuestra colección exclusiva de perfumes de diseñador. Las mejores marcas como Dior, Chanel, Tom Ford y más en un solo lugar.',
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
  openGraph: {
    title: 'Catálogo de Fragancias Premium | Bendita Store',
    description: 'Explora nuestra colección exclusiva de perfumes de diseñador. Envío a toda Colombia.',
    url: `${BASE_URL}/products`,
    images: [{ url: `${BASE_URL}/og-catalog.png` }],
    type: 'website',
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
