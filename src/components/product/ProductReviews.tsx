"use client";

import { Star } from "lucide-react";
import type { Review } from "@/types";

export function ProductReviews({ reviews }: { reviews?: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <section className="py-20 bg-navy-900 border-t border-white/5" id="reviews">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl text-crystal mb-4">Reseñas de Clientes</h2>
          <p className="font-body text-crystal/50">Este producto aún no tiene reseñas. ¡Sé el primero en opinar!</p>
        </div>
      </section>
    );
  }

  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <section className="py-20 bg-navy-900 border-t border-white/5" id="reviews">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <h2 className="font-display text-3xl md:text-4xl text-crystal mb-12 text-center">Reseñas de Clientes</h2>

        <div className="flex flex-col md:flex-row gap-12 md:gap-24">
          {/* Summary */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start">
            <span className="font-display text-6xl text-gold mb-2">{avgRating.toFixed(1)}</span>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(avgRating) ? "fill-gold text-gold" : "text-white/20"}`} />
              ))}
            </div>
            <p className="font-body text-sm text-crystal/60 mb-8">{reviews.length} opiniones</p>

            {/* Bars */}
            <div className="w-full flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reviews.filter(r => r.rating === stars).length;
                const pct = (count / reviews.length) * 100;
                return (
                  <div key={stars} className="flex items-center gap-3 text-sm font-body">
                    <span className="w-4 text-crystal/70">{stars}</span>
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <div className="flex-1 h-1.5 bg-navy-950 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-crystal/50 text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="md:w-2/3 flex flex-col gap-8">
            {reviews.map(review => (
              <div key={review.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-950 border border-white/10 flex items-center justify-center font-display text-lg text-gold shrink-0">
                  {review.profile?.full_name?.charAt(0) || "C"}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body font-medium text-crystal">{review.profile?.full_name || "Cliente Verificado"}</span>
                    <span className="font-body text-xs text-crystal/40">
                      {new Date(review.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= review.rating ? "fill-gold text-gold" : "text-white/20"}`} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="font-body text-sm text-crystal/80 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
