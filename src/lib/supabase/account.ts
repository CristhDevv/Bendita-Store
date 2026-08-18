import { createClient } from "./client";
import type { Order, WishlistItem, Address, Profile } from "@/types";

// ─── Orders ──────────────────────────────────────────────────
export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      address:addresses(*),
      items:order_items(
        *,
        product:products(id, name, slug, images, price)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Order[]) || [];
}

// ─── Wishlist ─────────────────────────────────────────────────
export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      *,
      product:products(
        id, name, slug, price, compare_price, images,
        concentration, gender, is_active,
        brand:brands(name)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as WishlistItem[]) || [];
}

export async function removeFromWishlist(userId: string, productId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

export async function addToWishlist(userId: string, productId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("wishlist")
    .upsert({ user_id: userId, product_id: productId });
  if (error) throw error;
}

// ─── Addresses ────────────────────────────────────────────────
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });

  if (error) throw error;
  return (data as Address[]) || [];
}

export async function upsertAddress(userId: string, address: Partial<Address>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("addresses")
    .upsert({ ...address, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(addressId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase client not available");

  /**
   * Atomicity: ideally this should be a single DB transaction via RPC.
   * The two-step approach below has a TOCTOU window where both steps could
   * partially fail. If you add the following function to your DB, use that instead:
   *
   *   CREATE OR REPLACE FUNCTION set_default_address(p_user_id uuid, p_address_id uuid)
   *   RETURNS void LANGUAGE plpgsql AS $$
   *   BEGIN
   *     UPDATE addresses SET is_default = false WHERE user_id = p_user_id;
   *     UPDATE addresses SET is_default = true WHERE id = p_address_id AND user_id = p_user_id;
   *   END; $$;
   */
  const { error: rpcError } = await supabase.rpc("set_default_address", {
    p_user_id: userId,
    p_address_id: addressId,
  });

  // If RPC doesn't exist yet, fall back to sequential updates
  if (rpcError && rpcError.code === "42883") {
    // 42883 = undefined_function in PostgreSQL
    const { error: unsetError } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
    if (unsetError) throw unsetError;

    const { error: setError } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId);
    if (setError) throw setError;
  } else if (rpcError) {
    throw rpcError;
  }
}

// ─── Profile ──────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
