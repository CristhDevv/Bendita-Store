import Link from "next/link";
import { Layers, Droplets, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-2">Configuración</h1>
        <p className="font-body text-charcoal-muted">Gestiona los catálogos y preferencias de la tienda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/admin/categories"
          className="bg-white border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-gold hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
            <Layers className="w-6 h-6 text-charcoal-muted group-hover:text-gold transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-charcoal mb-1 flex items-center justify-between">
              Categorías
              <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-gold transition-colors" />
            </h3>
            <p className="font-body text-sm text-charcoal-muted leading-relaxed">Organiza tus productos en categorías principales para facilitar la navegación en la tienda.</p>
          </div>
        </Link>

        <Link 
          href="/admin/olfactive-families"
          className="bg-white border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-gold hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
            <Droplets className="w-6 h-6 text-charcoal-muted group-hover:text-gold transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-charcoal mb-1 flex items-center justify-between">
              Familias Olfativas
              <ChevronRight className="w-4 h-4 text-charcoal-muted group-hover:text-gold transition-colors" />
            </h3>
            <p className="font-body text-sm text-charcoal-muted leading-relaxed">Administra las familias olfativas para ayudar a tus clientes a encontrar su aroma ideal.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
