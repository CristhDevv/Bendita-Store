"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Generar posiciones aleatorias para partículas (solo una vez)
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2,
    size: Math.random() > 0.5 ? 2 : 4,
  }));

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Decorative Left Side (Desktop) */}
      <div className="hidden lg:flex w-1/2 relative bg-cream-dark border-r border-border overflow-hidden items-center justify-center p-12">
        {/* Logo overlay */}
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="flex items-center gap-2 text-gold hover:text-gold-400 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-script text-4xl">Bendita Store</span>
          </Link>
        </div>

        {/* Floating Particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gold"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-lg text-center">
          <h2 className="font-display text-5xl text-charcoal mb-6 leading-tight">
            Descubre la esencia de la sofisticación.
          </h2>
          <p className="font-body text-charcoal-muted text-lg">
            Accede a nuestra colección premium de fragancias y experimenta un nivel superior de perfumería.
          </p>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-12 py-12 relative overflow-hidden">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6 z-20">
          <Link href="/" className="flex items-center gap-2 text-gold hover:text-gold-400 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-script text-3xl mt-1">Bendita Store</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto z-10 pt-16 lg:pt-0">
          <div className="bg-white border border-border rounded-3xl p-8 sm:p-10 shadow-xl relative">
            {children}
          </div>
        </div>

        {/* Mobile Ambient */}
        <div className="lg:hidden absolute top-0 right-0 w-[400px] h-[400px] bg-gold-500/10 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
