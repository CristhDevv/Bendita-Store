"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí se podría enviar a Sentry u otro servicio
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-border rounded-3xl p-8 text-center shadow-sm relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-cream border border-border rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-gold" />
          </div>

          <h1 className="font-display text-2xl text-charcoal mb-3">
            Algo no salió como esperábamos
          </h1>
          
          <p className="font-body text-charcoal-muted text-sm mb-8 leading-relaxed">
            Hemos encontrado un problema técnico inesperado. Nuestro equipo ya ha sido notificado. Por favor, intenta de nuevo.
          </p>

          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-body font-semibold text-white bg-charcoal hover:bg-gold transition-all hover:scale-[1.02] shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Intentar de nuevo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
