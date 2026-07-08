"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { CONFIG } from "@/lib/config";

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  
  // Scrollear arriba al cargar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 pt-32 pb-20 flex flex-col items-center justify-center px-4 text-center">
      
      {/* Animación de checkmark SVG */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mb-8"
      >
        <svg className="w-12 h-12 text-gold" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="font-display text-4xl md:text-5xl text-crystal mb-4"
      >
        ¡Pedido recibido!
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="font-body text-crystal/70 max-w-md mx-auto mb-8 text-lg"
      >
        Tu orden ha sido procesada correctamente. En breve recibirás un correo con la confirmación.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-navy-900/50 border border-gold-500/20 rounded-2xl p-6 mb-10 w-full max-w-md inline-block text-left backdrop-blur-sm"
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gold-500/10">
          <span className="text-crystal/60">Número de Orden</span>
          <span className="font-medium text-gold">#{(orderId ?? "").substring(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gold-500/10">
          <span className="text-crystal/60">Estado</span>
          <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full font-medium">Pendiente de pago</span>
        </div>
        <p className="text-sm text-crystal/80 leading-relaxed">
          Si elegiste pago por transferencia o Nequi, recuerda enviar el comprobante de pago al <a href={`https://wa.me/${CONFIG.SITE.WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">WhatsApp</a> con tu número de orden.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link 
          href="/account/orders"
          className="px-8 py-3 rounded-xl border border-gold text-gold font-medium transition-colors hover:bg-gold/10 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Ver mis pedidos
        </Link>
        <Link 
          href="/products"
          className="px-8 py-3 rounded-xl font-medium text-navy-950 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
        >
          Seguir comprando
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>

    </div>
  );
}
