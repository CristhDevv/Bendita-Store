import { POSHistorial } from "@/components/admin/pos/POSHistorial";

export const metadata = {
  title: "Historial de Caja | Panel de Administración",
  description: "Revisa el registro de ventas POS y estadísticas por canales.",
};

export default function POSHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal mb-1">Historial de Caja</h1>
        <p className="font-body text-sm text-charcoal-muted">
          Consulta las ventas registradas internamente y estadísticas del período.
        </p>
      </div>

      <POSHistorial />
    </div>
  );
}
