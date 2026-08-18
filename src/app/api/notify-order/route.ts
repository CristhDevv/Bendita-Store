import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/notify-order
 *
 * DEPRECATION NOTICE: Este endpoint se mantiene por compatibilidad,
 * pero la funcionalidad principal ha sido migrada a la Server Action
 * `src/lib/actions/notify.ts`. Úsalo sólo para integraciones externas.
 *
 * Seguridad:
 * - Si API_NOTIFY_SECRET está configurado en las env vars, el request
 *   debe incluir el header `x-api-secret` con el valor correcto.
 * - El email destinatario y remitente se leen de variables de entorno.
 */
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // Verificar secret si está configurado
    const apiSecret = process.env.API_NOTIFY_SECRET;
    if (apiSecret) {
      const providedSecret = req.headers.get("x-api-secret");
      if (providedSecret !== apiSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { orderId, customerName, total, paymentMethod, items } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("[notify-order] ADMIN_EMAIL env var not set");
      return NextResponse.json({ success: true, skipped: true });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    const formattedTotal = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(total || 0);

    const itemsHtml = Array.isArray(items)
      ? items
          .map(
            (item) =>
              `<li>${item.quantity}x ${item.name} (${new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(item.price)})</li>`
          )
          .join("")
      : "<li>No hay items registrados en el evento</li>";

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🛍️ ¡Nuevo pedido recibido!</h2>
        <p><strong>ID de Orden:</strong> #${shortOrderId}</p>
        <p><strong>Cliente:</strong> ${customerName || "No especificado"}</p>
        <p><strong>Total:</strong> ${formattedTotal}</p>
        <p><strong>Método de pago:</strong> <span style="text-transform: capitalize;">${paymentMethod || "No especificado"}</span></p>
        
        <h3 style="margin-top: 24px;">Resumen de compra:</h3>
        <ul>${itemsHtml}</ul>
        
        <hr style="border: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">Este correo fue generado automáticamente por Bendita Store.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🛍️ Nuevo pedido #${shortOrderId} de ${customerName || "Cliente"}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error sending order notification email:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
