import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PromoSection() {
  return (
    <section className="w-full">
      <div className="w-full bg-charcoal relative overflow-hidden">
        {/* Pattern overlay for extra texture */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)" 
          }}
        />
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="text-center md:text-left">
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-6">
              Envíos a todo <br className="hidden md:block" />
              Colombia
            </h2>
            <div className="p-4 rounded-xl border border-gold/30 bg-white/10 backdrop-blur-sm flex justify-between items-center shadow-sm text-left">
              <div>
                <p className="font-medium text-white">Envío estándar</p>
                <p className="text-sm text-white/70">2 a 5 días calendario según transportadora</p>
              </div>
              <span className="text-white/70 font-medium text-sm ml-4 text-right">
                A cargo del<br/>destinatario
              </span>
            </div>
          </div>
          
          <Link 
            href="/products"
            className="shrink-0 inline-flex items-center gap-2 px-10 py-5 bg-gold text-charcoal rounded-xl font-body font-bold hover:bg-white hover:scale-105 transition-all shadow-xl shadow-gold/20 uppercase tracking-widest text-xs"
          >
            Comprar Ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
