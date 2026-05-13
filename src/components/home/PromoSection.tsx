import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PromoSection() {
  return (
    <section className="w-full">
      <div className="w-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 relative overflow-hidden">
        {/* Pattern overlay for extra texture */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: "repeating-linear-gradient(45deg, #04091f 0, #04091f 2px, transparent 2px, transparent 10px)" 
          }}
        />
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="text-center md:text-left">
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-navy-950 leading-tight">
              Envío gratis en compras <br className="hidden md:block" />
              mayores a $200.000
            </h2>
          </div>
          
          <Link 
            href="/products"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-navy-950 text-gold rounded-full font-body font-medium hover:bg-navy-800 hover:scale-105 transition-all shadow-xl"
          >
            Comprar Ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
