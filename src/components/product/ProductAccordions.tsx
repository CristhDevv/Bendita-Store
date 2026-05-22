"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export function ProductAccordions({ description }: { description?: string }) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  const items: AccordionItem[] = [
    {
      title: "Descripción",
      content: <p className="text-charcoal-muted text-sm leading-relaxed">{description || "Una fragancia excepcional diseñada para cautivar los sentidos. Elaborada con los ingredientes más puros y duraderos."}</p>
    },
    {
      title: "Concentración y Duración",
      content: <p className="text-charcoal-muted text-sm leading-relaxed">Esta fragancia ofrece una alta concentración de aceites esenciales, garantizando una duración prolongada en la piel (8-12 horas) y una proyección notable durante las primeras horas.</p>
    },
    {
      title: "Política de envío y devoluciones",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-gold bg-cream flex justify-between items-center shadow-sm">
            <div>
              <p className="font-medium text-charcoal">Envío estándar</p>
              <p className="text-sm text-charcoal-muted">2 a 5 días calendario según transportadora</p>
            </div>
            <span className="text-charcoal-muted font-medium text-sm">
              A cargo del destinatario
            </span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-cream">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal mb-1">Garantía del producto</p>
                <p className="font-body text-xs text-charcoal-muted leading-relaxed">
                  Cubrimos rotura de envase o válvula en mal estado. La garantía aplica únicamente durante las <strong className="text-charcoal">48 horas siguientes a la recepción del paquete</strong>. Te recomendamos revisar el producto al momento de recibirlo y contactarnos de inmediato si detectas algún inconveniente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col border-t border-border mt-8">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-border">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
            className="w-full flex items-center justify-between py-5 text-left focus:outline-none group"
          >
            <span className={`font-display text-lg transition-colors ${openIdx === idx ? "text-gold" : "text-charcoal group-hover:text-gold"}`}>
              {item.title}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIdx === idx ? "rotate-180 text-gold" : "text-charcoal-muted group-hover:text-gold"}`} />
          </button>
          <AnimatePresence initial={false}>
            {openIdx === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pb-6 font-body">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
