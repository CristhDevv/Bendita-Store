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
      content: <p className="text-crystal/70 text-sm leading-relaxed">{description || "Una fragancia excepcional diseñada para cautivar los sentidos. Elaborada con los ingredientes más puros y duraderos."}</p>
    },
    {
      title: "Concentración y Duración",
      content: <p className="text-crystal/70 text-sm leading-relaxed">Esta fragancia ofrece una alta concentración de aceites esenciales, garantizando una duración prolongada en la piel (8-12 horas) y una proyección notable durante las primeras horas.</p>
    },
    {
      title: "Política de envío y devoluciones",
      content: <p className="text-crystal/70 text-sm leading-relaxed">Envíos express a toda Colombia (2-4 días hábiles). Envío gratis por compras superiores a $200.000 COP. Aceptamos devoluciones dentro de los primeros 14 días si el producto no ha sido abierto.</p>
    }
  ];

  return (
    <div className="flex flex-col border-t border-white/10 mt-8">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-white/10">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
            className="w-full flex items-center justify-between py-5 text-left focus:outline-none group"
          >
            <span className={`font-display text-lg transition-colors ${openIdx === idx ? "text-gold" : "text-crystal group-hover:text-gold"}`}>
              {item.title}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIdx === idx ? "rotate-180 text-gold" : "text-crystal/50 group-hover:text-gold"}`} />
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
