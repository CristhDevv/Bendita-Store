"use server";

import { Resend } from "resend";

/**
 * Server Action: notifyNewOrder
 *
 * Sends an email notification to the store admin when a new order is placed.
 * Using a Server Action instead of an API route eliminates the need for a
 * shared secret since Server Actions are not publicly accessible endpoints.
 *
 * The Resend API key and admin email are server-side env vars — never exposed
 * to the client.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface NotifyOrderParams {
  orderId: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  items: OrderItem[];
}

export async function notifyNewOrder(params: NotifyOrderParams): Promise<void> {
  const { orderId, customerName, total, paymentMethod, items } = params;

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!adminEmail) {
    console.warn("[notifyNewOrder] ADMIN_EMAIL env var not set — skipping notification");
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[notifyNewOrder] RESEND_API_KEY env var not set — skipping notification");
    return;
  }

  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const formattedTotal = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(total || 0);

  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.quantity}x ${item.name} (${new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }).format(item.price)})</li>`
    )
    .join("");

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

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🛍️ Nuevo pedido #${shortOrderId} de ${customerName || "Cliente"}`,
      html: htmlContent,
    });

    if (error) {
      console.error("[notifyNewOrder] Resend error:", error);
    }
  } catch (err) {
    // Notification failures should never break the order flow
    console.error("[notifyNewOrder] Failed to send email:", err);
  }
}
