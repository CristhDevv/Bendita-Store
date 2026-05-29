"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, Trash2, Plus, Minus, User, Sparkles, AlertCircle, ShoppingCart, MessageCircle, Instagram, Store } from "lucide-react";
import { searchProducts, searchUsers, createPosSale } from "@/lib/supabase/pos";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface CartLine {
  product: Product;
  selectedMl?: number;
  quantity: number;
  unitPrice: number; // Editable
  originalPrice: number;
}

export function POSTerminal() {
  // Product Search
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // User Search
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Selected Customer / Free Info
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [anonName, setAnonName] = useState("");
  const [anonPhone, setAnonPhone] = useState("");

  // Sale metadata
  const [channel, setChannel] = useState<"whatsapp" | "instagram" | "efectivo">("whatsapp");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "nequi" | "daviplata">("efectivo");
  const [notes, setNotes] = useState("");

  // Cart
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search for products
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productQuery.trim().length > 1) {
        setSearchingProducts(true);
        const results = await searchProducts(productQuery);
        setProducts(results);
        setSearchingProducts(false);
        setShowProductDropdown(true);
      } else {
        setProducts([]);
        setShowProductDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery]);

  // Debounced search for users
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (userQuery.trim().length > 1) {
        setSearchingUsers(true);
        const results = await searchUsers(userQuery);
        setUsers(results);
        setSearchingUsers(false);
        setShowUserDropdown(true);
      } else {
        setUsers([]);
        setShowUserDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add product to cart
  const handleAddProduct = (product: Product, ml?: number, price?: number) => {
    const defaultPrice = price ?? product.price;
    const size = ml ?? (product.ml_options?.[0]?.ml || undefined);

    setCart((prev) => {
      // Check if product with same ML is already in cart
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedMl === size
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          selectedMl: size,
          quantity: 1,
          unitPrice: defaultPrice,
          originalPrice: defaultPrice,
        },
      ];
    });

    setProductQuery("");
    setShowProductDropdown(false);
    toast.success(`${product.name} agregado`);
  };

  // Modify quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // Modify unit price manually (allows discounts)
  const handleUpdatePrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCart((prev) => {
      const updated = [...prev];
      updated[index].unitPrice = newPrice;
      return updated;
    });
  };

  // Remove from cart
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    toast.error("Producto removido");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = subtotal - total;

  // Submit Sale
  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const saleData = {
        channel,
        customer_id: !isAnonymous && selectedUser ? selectedUser.id : null,
        customer_name: isAnonymous ? anonName : selectedUser?.full_name || null,
        customer_phone: isAnonymous ? anonPhone : selectedUser?.phone || null,
        payment_method: paymentMethod,
        subtotal,
        discount: discountTotal,
        total,
        notes: notes.trim() || null,
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name + (item.selectedMl ? ` (${item.selectedMl}ml)` : ""),
          quantity: item.quantity,
          unit_price: item.originalPrice,
          discount: item.originalPrice - item.unitPrice,
          final_price: item.unitPrice,
          ml: item.selectedMl || null,
        })),
      };

      await createPosSale(saleData);

      toast.success("Venta registrada exitosamente");
      // Reset Form
      setCart([]);
      setSelectedUser(null);
      setAnonName("");
      setAnonPhone("");
      setUserQuery("");
      setNotes("");
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al registrar la venta: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      {/* 1. PRODUCT FINDER */}
      <div 
        ref={productDropdownRef}
        className="order-1 lg:order-none lg:col-span-3 lg:col-start-1 lg:row-start-1 bg-white border border-border shadow-sm rounded-2xl p-6 relative"
      >
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-4">
          Buscar Fragancia / Producto
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-muted" />
          <input
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-cream border border-border focus:border-gold focus:bg-white text-charcoal font-body text-sm outline-none transition-all placeholder:text-charcoal-muted/60"
            placeholder="Escribe el nombre o marca del perfume..."
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            onFocus={() => {
              if (products.length > 0) setShowProductDropdown(true);
            }}
          />
          {searchingProducts && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
            </span>
          )}
        </div>

        {/* Product Dropdown Results */}
        {showProductDropdown && products.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 mx-6 bg-white border border-border shadow-2xl rounded-2xl overflow-hidden z-30 divide-y divide-border max-h-[300px] overflow-y-auto">
            {products.map((product) => (
              <div key={product.id} className="p-4 hover:bg-cream/40 transition-colors">
                <div className="flex items-center gap-3">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-cream rounded-lg text-gold text-xs font-display shrink-0">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm text-charcoal truncate">{product.name}</p>
                    <p className="text-[11px] text-gold uppercase tracking-wider font-semibold">
                      {product.brand?.name}
                    </p>
                  </div>
                  {!product.ml_options || product.ml_options.length === 0 ? (
                    <div className="text-right shrink-0">
                      <p className="font-body font-semibold text-sm text-charcoal">${formatPrice(product.price)}</p>
                      <p className="text-[10px] text-charcoal-muted font-body">Stock: {product.stock} und</p>
                    </div>
                  ) : (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-charcoal-muted font-body">Stock: {product.stock} und</p>
                    </div>
                  )}
                </div>

                {product.ml_options && product.ml_options.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3 pl-[52px]">
                    {product.ml_options.map((opt) => (
                      <button
                        key={opt.ml}
                        onClick={() => handleAddProduct(product, opt.ml, opt.price)}
                        className="px-3 py-1.5 bg-cream hover:bg-gold hover:text-white rounded-lg border border-border text-[11px] font-body text-charcoal transition-all"
                      >
                        {opt.ml}ml - ${formatPrice(opt.price)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleAddProduct(product)}
                      className="px-3 py-1.5 bg-cream hover:bg-gold hover:text-white rounded-lg border border-border text-[11px] font-body text-charcoal transition-all"
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. CART / SALE DETAILS */}
      <div className="order-2 lg:order-none lg:col-span-3 lg:col-start-1 lg:row-start-2 bg-white border border-border shadow-sm rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h2 className="font-display text-2xl font-semibold text-charcoal flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gold" />
            Detalle de Venta
          </h2>
          <span className="font-body text-xs text-charcoal-muted uppercase tracking-wider font-semibold">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-cream-dark mb-4 stroke-[1.2]" />
            <p className="font-display text-lg text-charcoal font-semibold">El carrito está vacío</p>
            <p className="font-body text-sm text-charcoal-muted mt-1 max-w-[280px]">
              Busca productos arriba para agregarlos a la venta.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.product.id}-${item.selectedMl}`} className="border border-border rounded-xl p-4 bg-cream/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-body font-medium text-sm text-charcoal">{item.product.name}</p>
                      <p className="text-[11px] text-charcoal-muted font-semibold uppercase tracking-wider mt-0.5 font-body">
                        {item.product.brand?.name} {item.selectedMl ? `• ${item.selectedMl}ml` : ""}
                      </p>
                      {item.product.wholesale_price && (
                        <span className="inline-block text-[9px] font-semibold text-gold bg-cream px-2 py-0.5 rounded border border-border/80 mt-1.5 font-body">
                          Mayorista
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-charcoal-muted hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/40">
                    {/* Qty controls */}
                    <div className="flex items-center border border-border rounded-lg bg-cream/30 p-1">
                      <button
                        onClick={() => handleUpdateQty(index, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm font-body">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(index, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unit Price */}
                    <div className="text-right space-y-1">
                      <div className="relative inline-block w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted text-xs font-body">$</span>
                        <input
                          type="number"
                          className="w-full pl-6 pr-3 py-1.5 text-right font-medium rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-charcoal text-sm font-body"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                        />
                      </div>
                      {item.unitPrice < item.originalPrice && (
                        <p className="text-[10px] text-rose-500 font-body">
                          -${formatPrice(item.originalPrice - item.unitPrice)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40 text-sm font-semibold">
                    <span className="text-charcoal-muted font-normal font-body">Total</span>
                    <span className="text-charcoal font-body">${formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left font-body text-sm divide-y divide-border">
                <thead>
                  <tr className="text-charcoal-muted text-xs uppercase tracking-wider pb-3 font-body">
                    <th className="pb-3 font-semibold">Producto</th>
                    <th className="pb-3 font-semibold text-center w-28">Cant.</th>
                    <th className="pb-3 font-semibold text-right w-40">Precio Unit. (COP)</th>
                    <th className="pb-3 font-semibold text-right w-32">Total</th>
                    <th className="pb-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item, index) => (
                    <tr key={`${item.product.id}-${item.selectedMl}`} className="align-middle">
                      <td className="py-4 pr-3">
                        <p className="font-medium text-charcoal">{item.product.name}</p>
                        <p className="text-[11px] text-charcoal-muted font-semibold uppercase tracking-wider mt-0.5 font-body">
                          {item.product.brand?.name} {item.selectedMl ? `• ${item.selectedMl}ml` : ""}
                        </p>
                        {item.product.wholesale_price && (
                          <span className="inline-block text-[9px] font-semibold text-gold bg-cream px-2 py-0.5 rounded border border-border/80 mt-1.5 font-body">
                            Mayorista
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center border border-border rounded-lg bg-cream/30 p-1">
                          <button
                            onClick={() => handleUpdateQty(index, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm font-body">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(index, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 text-right font-body">
                        <div className="relative inline-block w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted text-xs">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-3 py-1.5 text-right font-medium rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-charcoal text-sm font-body"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                          />
                        </div>
                        {item.unitPrice < item.originalPrice && (
                          <p className="text-[10px] text-rose-500 mt-1 text-right font-body">
                            -${formatPrice(item.originalPrice - item.unitPrice)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-right font-semibold text-charcoal font-body">
                        ${formatPrice(item.unitPrice * item.quantity)}
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 hover:bg-rose-50 text-charcoal-muted hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 3. FINANCIAL SUMMARY */}
      <div className="order-3 lg:order-none lg:col-span-2 lg:col-start-4 lg:row-start-2 bg-white border border-border shadow-sm rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-2xl font-semibold text-charcoal border-b border-border pb-3">
          Resumen Financiero
        </h3>

        <div className="space-y-3.5 text-sm font-body">
          <div className="flex justify-between text-charcoal-muted">
            <span>Subtotal bruto</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-rose-500 font-medium">
              <span>Descuento aplicado</span>
              <span>-${formatPrice(discountTotal)}</span>
            </div>
          )}
          <hr className="border-border my-2" />
          <div className="flex justify-between text-charcoal font-display text-2xl font-bold items-baseline">
            <span>Total a cobrar</span>
            <span className="text-gold text-3xl font-extrabold">${formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* 4. SALE SETTINGS / CUSTOMER SETUP */}
      <div className="order-4 lg:order-none lg:col-span-2 lg:col-start-4 lg:row-start-1 bg-white border border-border shadow-sm rounded-2xl p-6 space-y-5">
        <h3 className="font-display text-2xl font-semibold text-charcoal border-b border-border pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-gold" />
          Configuración de Venta
        </h3>

        {/* Customer Selection */}
        <div className="space-y-4">
          <div className="flex bg-cream border border-border rounded-xl p-1">
            <button
              onClick={() => {
                setIsAnonymous(true);
                setSelectedUser(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                isAnonymous ? "bg-charcoal text-white shadow-sm" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Anónimo
            </button>
            <button
              onClick={() => setIsAnonymous(false)}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                !isAnonymous ? "bg-charcoal text-white shadow-sm" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Registrado
            </button>
          </div>

          {isAnonymous ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5 font-bold">
                  Nombre del Cliente
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                  placeholder="Ej. Juan Pérez"
                  value={anonName}
                  onChange={(e) => setAnonName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5 font-bold">
                  Teléfono / WhatsApp
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                  placeholder="Ej. +573001234567"
                  value={anonPhone}
                  onChange={(e) => setAnonPhone(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="relative pt-1" ref={userDropdownRef}>
              <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5 font-bold">
                Buscar Usuario Registrado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
                <input
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                  placeholder="Buscar por nombre o correo..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onFocus={() => {
                    if (users.length > 0) setShowUserDropdown(true);
                  }}
                />
              </div>

              {selectedUser && (
                <div className="mt-3 bg-cream/40 border border-gold/30 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">{selectedUser.full_name}</p>
                    <p className="text-[11px] text-charcoal-muted mt-0.5">{selectedUser.email}</p>
                    {selectedUser.phone && <p className="text-[11px] text-charcoal-muted">{selectedUser.phone}</p>}
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-[11px] text-rose-500 hover:underline uppercase tracking-wider font-semibold"
                  >
                    Remover
                  </button>
                </div>
              )}

              {/* User Dropdown */}
              {showUserDropdown && users.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-border shadow-xl rounded-xl overflow-hidden z-20 divide-y divide-border max-h-[200px] overflow-y-auto">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setShowUserDropdown(false);
                        setUserQuery("");
                      }}
                      className="p-3 hover:bg-cream/40 cursor-pointer transition-colors text-xs font-body"
                    >
                      <p className="font-medium text-charcoal">{u.full_name || "Sin nombre"}</p>
                      <p className="text-[10px] text-charcoal-muted">{u.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Channel Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted font-bold">
            Canal de Venta
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, activeClass: "bg-emerald-500 border-emerald-500 text-white shadow-emerald-100" },
              { id: "instagram", label: "Instagram", icon: Instagram, activeClass: "bg-pink-500 border-pink-500 text-white shadow-pink-100" },
              { id: "efectivo", label: "Físico / Local", icon: Store, activeClass: "bg-charcoal border-charcoal text-white shadow-charcoal-100" }
            ].map((ch) => {
              const Icon = ch.icon;
              const isActive = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id as any)}
                  className={`py-3 px-2 text-center text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all shadow-sm font-body ${
                    isActive
                      ? `${ch.activeClass} font-bold scale-[1.02]`
                      : "bg-white text-charcoal-muted border-border hover:border-gold hover:text-gold"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted font-bold">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(["efectivo", "transferencia", "nequi", "daviplata"] as const).map((pm) => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                className={`py-3 px-3 text-center text-xs font-semibold rounded-xl border transition-all capitalize font-body ${
                  paymentMethod === pm
                    ? "bg-gold text-white border-gold shadow-sm shadow-gold-100 font-bold scale-[1.02]"
                    : "bg-white text-charcoal-muted border-border hover:border-gold hover:text-gold"
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted font-bold font-body">
            Notas Internas
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-cream/30 border border-border focus:border-gold outline-none text-xs text-charcoal font-body resize-none h-16"
            placeholder="Detalles de envío, envase de regalo, observaciones..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* 5. REGISTER SALE BUTTON */}
      <div className="order-5 lg:order-none lg:col-span-2 lg:col-start-4 lg:row-start-3">
        <button
          onClick={handleSubmitSale}
          disabled={isSubmitting || cart.length === 0}
          className="w-full h-14 bg-charcoal hover:bg-gold disabled:bg-charcoal/40 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] uppercase tracking-wider font-body"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Procesando venta...
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-gold fill-gold/20" />
              <span>Registrar Venta</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
