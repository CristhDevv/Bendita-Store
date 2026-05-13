import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Regístrate',
  description: 'Crea tu cuenta en Bendita Store y descubre un mundo de fragancias exclusivas.',
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
