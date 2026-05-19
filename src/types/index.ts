// ============================================================
// Bendita Store — TypeScript Types
// ============================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  country?: string;
  description?: string;
}

export interface OlfactiveFamily {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  wholesale_price?: number;
  compare_price?: number;
  category_id?: string;
  brand_id?: string;
  gender?: "men" | "women" | "unisex";
  concentration?: "parfum" | "edp" | "edt" | "edc" | "splash";
  ml_options?: { ml: number; price: number; wholesale_price?: number }[];
  images?: string[];
  stock: number;
  cost_price?: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  olfactive_family?: string[];
  // Joins
  category?: Category;
  brand?: Brand;
}

export interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  is_default: boolean;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  address_id?: string;
  payment_method?: string;
  payment_ref?: string;
  notes?: string;
  created_at: string;
  // Joins
  address?: Address;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  ml?: number;
  // Joins
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profile?: Profile;
}

// Cart (local state, no DB)
export interface CartItem {
  product: Product;
  quantity: number;
  selectedMl?: number;
  selectedPrice: number;
}
