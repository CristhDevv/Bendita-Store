"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const BRANDS = ["DIOR", "CHANEL", "TOM FORD", "CREED", "ARMANI", "VERSACE", "GUERLAIN", "YSL", "PACO RABANNE", "GIVENCHY", "LE LABO", "MFK"];

export function BrandShowcase() {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start" }, 
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  return (
    <section className="py-24 bg-cream-dark border-y border-border relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 mb-12">
        <h2 className="font-display text-3xl md:text-4xl text-charcoal text-center">
          Nuestras Marcas
        </h2>
      </div>

      <div className="relative max-w-[100vw]">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-cream-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-cream-dark to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {BRANDS.map((brand, i) => (
              <div key={i} className="flex-[0_0_50%] md:flex-[0_0_25%] lg:flex-[0_0_16.666%] min-w-0 flex items-center justify-center px-4">
                <span className="font-display text-2xl md:text-3xl font-bold tracking-widest text-charcoal-muted uppercase hover:text-gold transition-colors duration-300 cursor-pointer">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
