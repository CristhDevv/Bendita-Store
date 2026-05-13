import { createClient } from "./client";
import { Address, Order, OrderItem } from "@/types";

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
  return data || [];
}

export async function saveAddress(addressData: Partial<Address>): Promise<Address | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .insert([addressData])
    .select()
    .single();

  if (error) {
    console.error("Error saving address:", error);
    return null;
  }
  return data;
}

export async function createOrderTransaction(
  order: Partial<Order>,
  items: any[]
): Promise<string | null> {
  const supabase = createClient();
  
  // order is passed as a jsonb object to the rpc function
  const { data: orderId, error } = await supabase.rpc("create_order_with_items", {
    p_order: order,
    p_items: items,
  });

  if (error) {
    console.error("Error creating order with items:", error);
    return null;
  }

  return orderId;
}
