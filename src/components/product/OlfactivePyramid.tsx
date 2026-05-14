"use client";

import type { Product } from "@/types";

export function OlfactivePyramid({ product }: { product: Product }) {
  if (!product.notes_top?.length && !product.notes_heart?.length && !product.notes_base?.length) return null;

  return (
    <section className="py-20 bg-cream border-t border-border relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-[800px] h-[800px] text-gold" fill="none">
          <path d="M50 5 L95 90 L5 90 Z" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="font-body text-xs tracking-[0.2em] uppercase text-gold-400 mb-2">Composición</p>
          <h2 className="font-display text-4xl text-charcoal">Pirámide Olfativa</h2>
        </div>

        <div className="max-w-2xl mx-auto flex flex-col gap-16 relative">
          {/* Vertical connection line */}
          <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent -translate-x-1/2 hidden md:block" />

          {/* Top Notes */}
          {product.notes_top && product.notes_top.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative">
              <div className="md:w-1/3 text-center md:text-right">
                <h3 className="font-display text-xl text-gold mb-1">Notas de Salida</h3>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-wider">Los primeros 15 min</p>
              </div>
              <div className="w-16 h-16 shrink-0 rounded-full bg-white border border-border flex items-center justify-center z-10 shadow-sm">
                <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <div className="md:w-1/3 flex flex-wrap justify-center md:justify-start gap-2">
                {product.notes_top.map(n => <span key={n} className="px-3 py-1.5 rounded-full bg-white text-charcoal text-sm border border-border shadow-sm">{n}</span>)}
              </div>
            </div>
          )}

          {/* Heart Notes */}
          {product.notes_heart && product.notes_heart.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative">
              <div className="md:w-1/3 text-center md:text-right">
                <h3 className="font-display text-xl text-gold mb-1">Notas de Corazón</h3>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-wider">De 15 min a 4 hrs</p>
              </div>
              <div className="w-16 h-16 shrink-0 rounded-full bg-white border border-border flex items-center justify-center z-10 shadow-sm">
                <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <div className="md:w-1/3 flex flex-wrap justify-center md:justify-start gap-2">
                {product.notes_heart.map(n => <span key={n} className="px-3 py-1.5 rounded-full bg-white text-charcoal text-sm border border-border shadow-sm">{n}</span>)}
              </div>
            </div>
          )}

          {/* Base Notes */}
          {product.notes_base && product.notes_base.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative">
              <div className="md:w-1/3 text-center md:text-right">
                <h3 className="font-display text-xl text-gold mb-1">Notas de Fondo</h3>
                <p className="font-body text-xs text-charcoal-muted uppercase tracking-wider">Hasta 24 horas</p>
              </div>
              <div className="w-16 h-16 shrink-0 rounded-full bg-white border border-border flex items-center justify-center z-10 shadow-sm">
                <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div className="md:w-1/3 flex flex-wrap justify-center md:justify-start gap-2">
                {product.notes_base.map(n => <span key={n} className="px-3 py-1.5 rounded-full bg-white text-charcoal text-sm border border-border shadow-sm">{n}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
