"use server";

import { createClient } from "./server";

export async function searchProducts(query: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    let q = supabase
      .from("products")
      .select("id, name, slug, price, wholesale_price, images, stock, ml_options, brand:brands(name)")
      .eq("is_active", true)
      .limit(20);

    if (query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }

    const { data, error } = await q;

    if (error) {
      console.error("searchProducts error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchProducts:", error);
    return [];
  }
}

export async function searchUsers(query: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    let q = supabase
      .from("profiles_with_email")
      .select("id, full_name, email, phone")
      .limit(20);

    if (query.trim()) {
      const term = query.trim();
      q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data, error } = await q;

    if (error) {
      console.error("searchUsers error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return [];
  }
}

export async function createPosSale(data: {
  channel: "whatsapp" | "instagram" | "efectivo";
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: "efectivo" | "transferencia" | "nequi" | "daviplata";
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  created_by?: string | null;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    final_price: number;
    ml?: number | null;
  }[];
}) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("No se pudo conectar con Supabase");

    const salePayload = {
      channel: data.channel,
      customer_id: data.customer_id || null,
      customer_name: data.customer_name || null,
      customer_phone: data.customer_phone || null,
      payment_method: data.payment_method,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      total: data.total,
      notes: data.notes || null,
      created_by: data.created_by || null,
    };

    const itemsPayload = data.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      final_price: item.final_price,
      ml: item.ml || null,
    }));

    const { data: result, error } = await supabase.rpc("create_pos_sale_transaction", {
      p_sale: salePayload,
      p_items: itemsPayload,
    });

    if (error) {
      console.error("Error executing create_pos_sale_transaction:", error);
      throw new Error(error.message || "Error al registrar la venta");
    }

    const posSaleId = (result as { pos_sale_id?: string })?.pos_sale_id;
    if (!posSaleId) {
      throw new Error("No se recibió el identificador de la venta registrada");
    }

    return posSaleId;
  } catch (error) {
    console.error("Error in createPosSale Server Action:", error);
    throw error;
  }
}

export async function getPosSales(filters?: {
  dateFrom?: string;
  dateTo?: string;
  channel?: string;
}) {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    let query = supabase
      .from("pos_sales")
      .select("*, items:pos_sale_items(*), order:orders(*)")
      .order("created_at", { ascending: false });

    if (filters?.channel) {
      query = query.eq("channel", filters.channel);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getPosSales error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPosSales:", error);
    return [];
  }
}

interface SaleStatRow {
  channel: string;
  payment_method: string;
  total: number | string;
}

export async function getPosStats(dateFrom: string, dateTo: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: sales, error } = await supabase
      .from("pos_sales")
      .select("channel, payment_method, total")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo);

    if (error) {
      console.error("getPosStats error:", error);
      return null;
    }

    const byChannel: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    let grandTotal = 0;

    const rows = (sales as unknown as SaleStatRow[]) || [];
    rows.forEach((sale: SaleStatRow) => {
      const val = Number(sale.total) || 0;
      grandTotal += val;

      byChannel[sale.channel] = (byChannel[sale.channel] || 0) + val;
      byPaymentMethod[sale.payment_method] = (byPaymentMethod[sale.payment_method] || 0) + val;
    });

    return {
      byChannel,
      byPaymentMethod,
      grandTotal,
      count: sales?.length || 0,
    };
  } catch (error) {
    console.error("Error in getPosStats:", error);
    return null;
  }
}

export async function deletePosSale(id: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("No se pudo conectar con Supabase");

    // 1. Obtener el order_id asociado a la venta POS
    const { data: saleData } = await supabase
      .from("pos_sales")
      .select("order_id")
      .eq("id", id)
      .single();

    const orderId = saleData?.order_id;

    // 2. Eliminar pos_sales (los items en pos_sale_items se eliminan por FK ON DELETE CASCADE)
    const { error: deleteSaleErr } = await supabase
      .from("pos_sales")
      .delete()
      .eq("id", id);

    if (deleteSaleErr) {
      throw new Error(`Failed to delete POS sale: ${deleteSaleErr.message}`);
    }

    // 3. Eliminar la orden vinculada si existe
    if (orderId) {
      const { error: deleteOrderErr } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteOrderErr) {
        console.warn(`No se pudo eliminar la orden vinculada: ${deleteOrderErr.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error in deletePosSale:", error);
    throw error;
  }
}
