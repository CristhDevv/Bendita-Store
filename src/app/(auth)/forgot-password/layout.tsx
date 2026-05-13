import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recuperar Contraseña',
  description: '¿Olvidaste tu contraseña? Solicita un enlace de recuperación para volver a ingresar a tu cuenta.',
  alternates: {
    canonical: '/forgot-password',
  },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
