"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ProductGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const safeImages = images?.length ? images : ["/hero-perfume.png"];

  const next = () => setActive(i => (i + 1) % safeImages.length);
  const prev = () => setActive(i => (i - 1 + safeImages.length) % safeImages.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Main image with zoom on hover */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-border group">
        <div className="w-full h-full overflow-hidden">
          <Image
            src={safeImages[active]}
            alt="Product Image"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-150 origin-center"
          />
        </div>
        
        {/* Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-charcoal hover:bg-border opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-charcoal hover:bg-border opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`relative w-24 aspect-square shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                active === idx ? "border-gold" : "border-transparent hover:border-gold"
              }`}
            >
              <Image src={img} alt={`Thumbnail ${idx}`} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
