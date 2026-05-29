"use server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAnonHeaders() {
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  }
  return {
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

function getServiceHeaders() {
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

export async function searchProducts(query: string) {
  try {
    if (!supabaseUrl) return [];
    
    let url = `${supabaseUrl}/rest/v1/products?select=id,name,slug,price,wholesale_price,images,stock,ml_options,brand:brands(name)&is_active=eq.true`;
    if (query.trim()) {
      url += `&name=ilike.*${encodeURIComponent(query.trim())}*`;
    }
    url += `&limit=20`;

    const res = await fetch(url, {
      headers: getAnonHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("searchProducts error:", await res.text());
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error in searchProducts:", error);
    return [];
  }
}

export async function searchUsers(query: string) {
  try {
    if (!supabaseUrl) return [];

    let url = `${supabaseUrl}/rest/v1/profiles_with_email?select=id,full_name,email,phone`;
    if (query.trim()) {
      const q = encodeURIComponent(query.trim());
      url += `&or=(full_name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*)`;
    }
    url += `&limit=20`;

    const res = await fetch(url, {
      headers: getServiceHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("searchUsers error:", await res.text());
      return [];
    }

    return await res.json();
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
    if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

    // 1. Crear la orden vinculada mediante RPC create_order_with_items
    const orderData = {
      user_id: data.customer_id || null,
      status: "delivered",
      total: data.total,
      payment_method: data.payment_method,
      notes: data.notes || `Venta POS por canal ${data.channel}`,
      source: "pos",
    };

    const orderItems = data.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.final_price, // El precio final cobrado por unidad
      ml: item.ml || null,
    }));

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/create_order_with_items`, {
      method: "POST",
      headers: getAnonHeaders(),
      body: JSON.stringify({
        p_order: orderData,
        p_items: orderItems,
      }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      throw new Error(`Failed to create order via RPC: ${errText}`);
    }

    const orderId = await rpcRes.json();

    // 2. Insertar en pos_sales
    const posSaleRes = await fetch(`${supabaseUrl}/rest/v1/pos_sales`, {
      method: "POST",
      headers: {
        ...getServiceHeaders(),
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        channel: data.channel,
        customer_id: data.customer_id || null,
        customer_name: data.customer_name || null,
        customer_phone: data.customer_phone || null,
        payment_method: data.payment_method,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        notes: data.notes || null,
        created_by: data.created_by || null,
        order_id: orderId,
      }),
    });

    if (!posSaleRes.ok) {
      const errText = await posSaleRes.text();
      throw new Error(`Failed to create POS sale record: ${errText}`);
    }

    const posSalesResult = await posSaleRes.json();
    const posSaleId = posSalesResult[0]?.id;

    if (!posSaleId) {
      throw new Error("No POS sale ID returned from insertion");
    }

    // 3. Insertar items en pos_sale_items
    const posSaleItemsData = data.items.map(item => ({
      pos_sale_id: posSaleId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      final_price: item.final_price,
    }));

    const itemsRes = await fetch(`${supabaseUrl}/rest/v1/pos_sale_items`, {
      method: "POST",
      headers: getServiceHeaders(),
      body: JSON.stringify(posSaleItemsData),
    });

    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      throw new Error(`Failed to insert POS sale items: ${errText}`);
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
    if (!supabaseUrl) return [];

    let url = `${supabaseUrl}/rest/v1/pos_sales?select=*,items:pos_sale_items(*),order:orders(*)&order=created_at.desc`;

    if (filters?.channel) {
      url += `&channel=eq.${encodeURIComponent(filters.channel)}`;
    }
    if (filters?.dateFrom) {
      url += `&created_at=gte.${encodeURIComponent(filters.dateFrom)}`;
    }
    if (filters?.dateTo) {
      url += `&created_at=lte.${encodeURIComponent(filters.dateTo)}`;
    }

    const res = await fetch(url, {
      headers: getServiceHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("getPosSales error:", await res.text());
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error in getPosSales:", error);
    return [];
  }
}

export async function getPosStats(dateFrom: string, dateTo: string) {
  try {
    if (!supabaseUrl) return null;

    const url = `${supabaseUrl}/rest/v1/pos_sales?select=channel,payment_method,total&created_at=gte.${encodeURIComponent(dateFrom)}&created_at=lte.${encodeURIComponent(dateTo)}`;

    const res = await fetch(url, {
      headers: getServiceHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("getPosStats error:", await res.text());
      return null;
    }

    const sales: { channel: string; payment_method: string; total: number | string }[] = await res.json();

    const byChannel: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    let grandTotal = 0;

    sales.forEach(sale => {
      const val = Number(sale.total) || 0;
      grandTotal += val;

      byChannel[sale.channel] = (byChannel[sale.channel] || 0) + val;
      byPaymentMethod[sale.payment_method] = (byPaymentMethod[sale.payment_method] || 0) + val;
    });

    return {
      byChannel,
      byPaymentMethod,
      grandTotal,
      count: sales.length,
    };
  } catch (error) {
    console.error("Error in getPosStats:", error);
    return null;
  }
}
