import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/types";

// ─── Mock product fixtures ─────────────────────────────────────────────────────
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Baccarat Rouge 540",
  slug: "baccarat-rouge-540",
  price: 350000,
  wholesale_price: 280000,
  stock: 10,
  is_featured: true,
  is_active: true,
  show_in_catalog: true,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const productWithMl: Product = makeProduct({
  id: "prod-ml",
  name: "Creed Aventus",
  ml_options: [
    { ml: 50, price: 200000, wholesale_price: 160000 },
    { ml: 100, price: 350000, wholesale_price: 280000 },
  ],
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getStore() {
  return useCartStore.getState();
}

function resetStore() {
  useCartStore.setState({ items: [], isOpen: false });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("Cart Store — addItem", () => {
  beforeEach(resetStore);

  it("adds a new product to the cart", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    expect(getStore().items).toHaveLength(1);
    expect(getStore().items[0].product.id).toBe("prod-1");
    expect(getStore().items[0].quantity).toBe(1);
  });

  it("increments quantity when adding an existing product", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().addItem(product, 2);
    expect(getStore().items).toHaveLength(1);
    expect(getStore().items[0].quantity).toBe(3);
  });

  it("treats same product with different ml as separate items", () => {
    getStore().addItem(productWithMl, 1, 50);
    getStore().addItem(productWithMl, 1, 100);
    expect(getStore().items).toHaveLength(2);
  });

  it("increments correctly when same product with same ml is added twice", () => {
    getStore().addItem(productWithMl, 1, 50);
    getStore().addItem(productWithMl, 2, 50);
    expect(getStore().items).toHaveLength(1);
    expect(getStore().items[0].quantity).toBe(3);
  });

  it("uses the ml option price for the selected variant", () => {
    getStore().addItem(productWithMl, 1, 50);
    expect(getStore().items[0].selectedPrice).toBe(200000);
  });
});

describe("Cart Store — removeItem", () => {
  beforeEach(resetStore);

  it("removes an existing item from the cart", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().removeItem("prod-1");
    expect(getStore().items).toHaveLength(0);
  });

  it("removes only the item matching the given ml", () => {
    getStore().addItem(productWithMl, 1, 50);
    getStore().addItem(productWithMl, 1, 100);
    getStore().removeItem("prod-ml", 50);
    expect(getStore().items).toHaveLength(1);
    expect(getStore().items[0].selectedMl).toBe(100);
  });

  it("does nothing when removing a non-existent item", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().removeItem("non-existent-id");
    expect(getStore().items).toHaveLength(1);
  });
});

describe("Cart Store — updateQuantity", () => {
  beforeEach(resetStore);

  it("updates the quantity of an item", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().updateQuantity("prod-1", 5);
    expect(getStore().items[0].quantity).toBe(5);
  });

  it("removes item when quantity is set to 0", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().updateQuantity("prod-1", 0);
    expect(getStore().items).toHaveLength(0);
  });

  it("removes item when quantity is set to negative", () => {
    const product = makeProduct();
    getStore().addItem(product, 1);
    getStore().updateQuantity("prod-1", -1);
    expect(getStore().items).toHaveLength(0);
  });
});

describe("Cart Store — clearCart", () => {
  beforeEach(resetStore);

  it("removes all items from the cart", () => {
    getStore().addItem(makeProduct({ id: "p1" }), 2);
    getStore().addItem(makeProduct({ id: "p2" }), 3);
    expect(getStore().items).toHaveLength(2);
    getStore().clearCart();
    expect(getStore().items).toHaveLength(0);
  });
});

describe("Cart Store — totalItems and totalPrice", () => {
  beforeEach(resetStore);

  it("returns 0 for empty cart", () => {
    expect(getStore().totalItems()).toBe(0);
    expect(getStore().totalPrice()).toBe(0);
  });

  it("counts total items correctly", () => {
    getStore().addItem(makeProduct({ id: "p1" }), 2);
    getStore().addItem(makeProduct({ id: "p2" }), 3);
    expect(getStore().totalItems()).toBe(5);
  });

  it("calculates total price correctly", () => {
    const p1 = makeProduct({ id: "p1", price: 100000 });
    const p2 = makeProduct({ id: "p2", price: 200000 });
    getStore().addItem(p1, 2); // 200.000
    getStore().addItem(p2, 1); // 200.000
    expect(getStore().totalPrice()).toBe(400000);
  });
});

describe("Cart Store — wholesale pricing logic", () => {
  beforeEach(resetStore);

  it("uses regular price when cart has fewer than 6 items total", () => {
    const product = makeProduct({ price: 350000, wholesale_price: 280000 });
    getStore().addItem(product, 5);
    expect(getStore().items[0].selectedPrice).toBe(350000);
  });

  it("switches to wholesale price when cart reaches 6+ items total", () => {
    const product = makeProduct({ price: 350000, wholesale_price: 280000 });
    getStore().addItem(product, 6);
    expect(getStore().items[0].selectedPrice).toBe(280000);
  });

  it("recalculates all items when a new item pushes total to 6+", () => {
    const p1 = makeProduct({ id: "p1", price: 350000, wholesale_price: 280000 });
    const p2 = makeProduct({ id: "p2", price: 200000, wholesale_price: 160000 });
    getStore().addItem(p1, 5);
    // Still 5 items — regular prices
    expect(getStore().items[0].selectedPrice).toBe(350000);
    // Add 1 more to hit the threshold
    getStore().addItem(p2, 1);
    // Now 6 items — all should be at wholesale prices
    const p1Item = getStore().items.find((i) => i.product.id === "p1");
    const p2Item = getStore().items.find((i) => i.product.id === "p2");
    expect(p1Item?.selectedPrice).toBe(280000);
    expect(p2Item?.selectedPrice).toBe(160000);
  });

  it("reverts to regular price when items drop below 6 after removal", () => {
    const product = makeProduct({ price: 350000, wholesale_price: 280000 });
    getStore().addItem(product, 6);
    expect(getStore().items[0].selectedPrice).toBe(280000);
    getStore().updateQuantity("prod-1", 5);
    expect(getStore().items[0].selectedPrice).toBe(350000);
  });

  it("uses ml option wholesale price when available", () => {
    // Add 6 items with ml variant that has its own wholesale price
    getStore().addItem(productWithMl, 6, 50);
    expect(getStore().items[0].selectedPrice).toBe(160000); // ml 50 wholesale
  });
});

describe("Cart Store — open/close", () => {
  beforeEach(resetStore);

  it("opens and closes the cart", () => {
    expect(getStore().isOpen).toBe(false);
    getStore().openCart();
    expect(getStore().isOpen).toBe(true);
    getStore().closeCart();
    expect(getStore().isOpen).toBe(false);
  });
});
