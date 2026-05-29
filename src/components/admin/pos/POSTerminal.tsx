"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, Trash2, Plus, Minus, User, Sparkles, AlertCircle, ShoppingCart } from "lucide-react";
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT & CENTER: Terminal core */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Finder Card */}
        <div className="bg-white border border-border shadow-sm rounded-2xl p-5 relative" ref={productDropdownRef}>
          <label className="block font-display text-sm font-semibold text-charcoal mb-2">
            Buscar Fragancia / Producto
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/40 border border-border focus:border-gold focus:bg-white text-charcoal font-body text-sm outline-none transition-all placeholder:text-charcoal-muted"
              placeholder="Escribe el nombre o marca del perfume..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              onFocus={() => {
                if (products.length > 0) setShowProductDropdown(true);
              }}
            />
            {searchingProducts && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
              </span>
            )}
          </div>

          {/* Product Dropdown Results */}
          {showProductDropdown && products.length > 0 && (
            <div className="absolute left-5 right-5 mt-2 bg-white border border-border shadow-xl rounded-xl overflow-hidden z-30 divide-y divide-border max-h-[300px] overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="p-3 hover:bg-cream/40 transition-colors">
                  {product.ml_options && product.ml_options.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="font-body font-medium text-sm text-charcoal">{product.name}</p>
                          <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                            {product.brand?.name} • Multi-tamaño
                          </p>
                        </div>
                        <span className="text-xs font-body text-charcoal-muted">Stock: {product.stock} und</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {product.ml_options.map((opt) => (
                          <button
                            key={opt.ml}
                            onClick={() => handleAddProduct(product, opt.ml, opt.price)}
                            className="px-2.5 py-1 bg-cream hover:bg-gold hover:text-white rounded-lg border border-border text-[11px] font-body text-charcoal transition-all"
                          >
                            {opt.ml}ml - ${formatPrice(opt.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleAddProduct(product)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-body font-medium text-sm text-charcoal">{product.name}</p>
                        <p className="text-[10px] text-charcoal-muted uppercase tracking-wider">
                          {product.brand?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-body font-semibold text-sm text-gold">${formatPrice(product.price)}</p>
                        <p className="text-[10px] text-charcoal-muted">Stock: {product.stock} und</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart items Table */}
        <div className="bg-white border border-border shadow-sm rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h2 className="font-display text-lg font-bold text-charcoal flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gold" />
              Detalle de Venta
            </h2>
            <span className="font-body text-xs text-charcoal-muted uppercase tracking-wider">
              {cart.length} productos agregados
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-cream-dark mb-3 stroke-[1.2]" />
              <p className="font-display text-sm text-charcoal font-semibold">El carrito está vacío</p>
              <p className="font-body text-xs text-charcoal-muted mt-1 max-w-[280px]">
                Busca productos arriba para agregarlos a la venta.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm divide-y divide-border">
                <thead>
                  <tr className="text-charcoal-muted text-xs uppercase tracking-wider pb-3">
                    <th className="pb-3 font-semibold">Producto</th>
                    <th className="pb-3 font-semibold text-center w-24">Cant.</th>
                    <th className="pb-3 font-semibold text-right w-36">Precio Unit. (COP)</th>
                    <th className="pb-3 font-semibold text-right w-28">Total</th>
                    <th className="pb-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item, index) => (
                    <tr key={`${item.product.id}-${item.selectedMl}`} className="align-middle">
                      <td className="py-4 pr-3">
                        <p className="font-medium text-charcoal">{item.product.name}</p>
                        <p className="text-[10px] text-charcoal-muted font-semibold uppercase tracking-wider">
                          {item.product.brand?.name} {item.selectedMl ? `• ${item.selectedMl}ml` : ""}
                        </p>
                        {item.product.wholesale_price && (
                          <span className="inline-block text-[9px] font-semibold text-gold bg-cream px-1.5 py-0.5 rounded border border-border/80 mt-1">
                            Wholesale: ${formatPrice(item.product.wholesale_price)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center border border-border rounded-lg bg-cream/30 p-1">
                          <button
                            onClick={() => handleUpdateQty(index, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(index, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="relative inline-block w-full max-w-[120px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-muted text-xs">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-2 py-1.5 text-right font-medium rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-charcoal"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                          />
                        </div>
                        {item.unitPrice < item.originalPrice && (
                          <p className="text-[10px] text-rose-500 mt-1">
                            Desc: -${formatPrice(item.originalPrice - item.unitPrice)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-right font-semibold text-charcoal">
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
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Client section, settings & totals */}
      <div className="space-y-6">
        {/* Customer & Channel Setup Card */}
        <div className="bg-white border border-border shadow-sm rounded-2xl p-5 space-y-5">
          <h3 className="font-display text-md font-bold text-charcoal border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-gold" />
            Configuración de Venta
          </h3>

          {/* Customer Selection */}
          <div className="space-y-3">
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
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5">
                    Nombre del Cliente
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                    placeholder="Ej. Juan Pérez"
                    value={anonName}
                    onChange={(e) => setAnonName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                    placeholder="Ej. +573001234567"
                    value={anonPhone}
                    onChange={(e) => setAnonPhone(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="relative pt-1" ref={userDropdownRef}>
                <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5">
                  Buscar Usuario Registrado
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-muted" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-sm text-charcoal font-body"
                    placeholder="Buscar por nombre o correo..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onFocus={() => {
                      if (users.length > 0) setShowUserDropdown(true);
                    }}
                  />
                </div>

                {selectedUser && (
                  <div className="mt-3 bg-cream/40 border border-gold/30 rounded-xl p-3 flex items-start justify-between">
                    <div>
                      <p className="font-body text-xs font-semibold text-charcoal">{selectedUser.full_name}</p>
                      <p className="text-[10px] text-charcoal-muted mt-0.5">{selectedUser.email}</p>
                      {selectedUser.phone && <p className="text-[10px] text-charcoal-muted">{selectedUser.phone}</p>}
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-[10px] text-rose-500 hover:underline uppercase tracking-wider"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {/* User Dropdown */}
                {showUserDropdown && users.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-border shadow-xl rounded-lg overflow-hidden z-20 divide-y divide-border max-h-[200px] overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setShowUserDropdown(false);
                          setUserQuery("");
                        }}
                        className="p-2.5 hover:bg-cream/40 cursor-pointer transition-colors text-xs"
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
          <div>
            <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-2">
              Canal de Venta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["whatsapp", "instagram", "efectivo"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-1 text-center text-xs font-medium rounded-lg border transition-all capitalize ${
                    channel === ch
                      ? "bg-gold text-white border-gold shadow-sm font-semibold"
                      : "bg-white text-charcoal-muted border-border hover:border-gold hover:text-gold"
                  }`}
                >
                  {ch === "efectivo" ? "Físico / Local" : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["efectivo", "transferencia", "nequi", "daviplata"] as const).map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 px-1 text-center text-xs font-medium rounded-lg border transition-all capitalize ${
                    paymentMethod === pm
                      ? "bg-gold text-white border-gold shadow-sm font-semibold"
                      : "bg-white text-charcoal-muted border-border hover:border-gold hover:text-gold"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-body uppercase tracking-wider text-charcoal-muted mb-1.5">
              Notas Internas
            </label>
            <textarea
              className="w-full px-3.5 py-2 rounded-lg bg-cream/20 border border-border focus:border-gold outline-none text-xs text-charcoal font-body resize-none h-16"
              placeholder="Detalles de envío, envase de regalo, observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Summary & Register Card */}
        <div className="bg-white border border-border shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-md font-bold text-charcoal border-b border-border pb-3">
            Resumen Financiero
          </h3>

          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between text-charcoal-muted">
              <span>Subtotal bruto</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Descuento aplicado</span>
                <span>-${formatPrice(discountTotal)}</span>
              </div>
            )}
            <hr className="border-border my-1" />
            <div className="flex justify-between text-charcoal font-display text-lg font-bold">
              <span>Total a cobrar</span>
              <span className="text-gold">${formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 bg-charcoal hover:bg-gold disabled:bg-charcoal/40 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
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
                <Sparkles className="w-4 h-4 text-gold" />
                Registrar Venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
