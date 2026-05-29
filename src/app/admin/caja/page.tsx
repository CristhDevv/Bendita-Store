import { POSTerminal } from "@/components/admin/pos/POSTerminal";

export const metadata = {
  title: "Caja Interna | Panel de Administración",
  description: "Registra ventas de canales externos (WhatsApp, Instagram, Físico).",
};

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Caja Interna</h1>
        <p className="font-body text-sm text-charcoal-muted">
          Registra y procesa ventas concretadas por canales externos.
        </p>
      </div>

      <POSTerminal />
    </div>
  );
}
