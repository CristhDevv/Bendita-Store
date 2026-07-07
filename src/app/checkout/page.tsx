"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronRight, Loader2, MapPin, CreditCard, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { getUserAddresses, saveAddress, createOrderTransaction } from "@/lib/supabase/checkout";
import { Address, Order } from "@/types";
import toast from "react-hot-toast";
import { useTracking } from "@/hooks/useTracking";


function buildWhatsAppMessage(orderId: string, items: any[], address: { street?: string; city?: string; state?: string }, total: number) {
  const itemsList = items.map((item) => 
    `- ${item.product.name} (${item.selectedMl}ml) x${item.quantity} — $${(item.selectedPrice * item.quantity).toLocaleString("es-CO")} COP`
  ).join('\n');

  return `Hola! Aquí los detalles de mi pedido:

🛍️ Pedido: #${orderId}

📦 Productos:
${itemsList}

📍 Dirección de entrega:
${address.street}, ${address.city}, ${address.state}

💰 Total a pagar: $${total.toLocaleString("es-CO")} COP

Deseo coordinar el pago por transferencia bancaria. ¿A qué cuenta puedo consignar?`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state: any) => state.items);
  const clearCart = useCartStore((state: any) => state.clearCart);
  const { trackEvent } = useTracking();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Paso 1: Información
  const [contactInfo, setContactInfo] = useState({ fullName: "", email: "", phone: "" });

  // Paso 2: Envío
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isNewAddress, setIsNewAddress] = useState(true);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", postal_code: "" });
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Paso 3: Pago
  const [paymentMethod, setPaymentMethod] = useState("transfer");

  useEffect(() => {
    if (items.length >= 2 && paymentMethod === "cod") {
      setPaymentMethod("transfer");
    }
  }, [items.length]);

  useEffect(() => {
    if (user) {
      setContactInfo({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
      });
      loadAddresses(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (items.length === 0 && !isPlacingOrder) {
      router.push("/products");
    } else if (items.length > 0) {
      // Fire begin_checkout once on mount
      trackEvent("begin_checkout", {
        item_count: items.length,
        subtotal: items.reduce((acc: number, item: any) => acc + item.selectedPrice * item.quantity, 0),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAddresses = async (userId: string) => {
    const data = await getUserAddresses(userId);
    setAddresses(data);
    if (data.length > 0) {
      setSelectedAddressId(data[0].id);
      setIsNewAddress(false);
    } else {
      setIsNewAddress(true);
    }
  };

  const subtotal = items.reduce((acc: number, item: any) => acc + item.selectedPrice * item.quantity, 0);
  const total = subtotal;

  const handleNextStep = async () => {
    if (step === 1) {
      if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
        toast.error("Por favor completa toda tu información de contacto.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (isNewAddress) {
        if (!newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
          toast.error("Por favor completa todos los campos de la dirección.");
          return;
        }
      } else {
        if (!selectedAddressId) {
          toast.error("Selecciona una dirección de envío.");
          return;
        }
      }
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    if (isNewAddress) {
      if (!newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
        toast.error("Por favor completa todos los campos de la dirección (calle, ciudad, departamento).");
        return;
      }
    } else if (!selectedAddressId) {
      toast.error("Por favor selecciona una dirección de envío.");
      return;
    }

    setIsPlacingOrder(true);
    let finalAddressId = selectedAddressId;

    // Si es dirección nueva y el usuario quiere guardarla y está logueado
    if (isNewAddress && user) {
      if (saveNewAddress) {
        const saved = await saveAddress({
          user_id: user.id,
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          postal_code: newAddress.postal_code,
          country: "Colombia",
          is_default: addresses.length === 0,
        });
        if (saved) finalAddressId = saved.id;
      }
    }

    // Preparar notas si es guest o no guardó la dirección
    let notes = "";
    if (isNewAddress && (!user || !saveNewAddress)) {
      notes = `Envío: ${newAddress.street}, ${newAddress.city}, ${newAddress.state}, ${newAddress.postal_code}`;
    }

    const orderData: Partial<Order> = {
      status: "pending",
      total: total,
      address_id: finalAddressId || undefined,
      payment_method: paymentMethod,
      notes: notes || undefined,
      customer_name: contactInfo.fullName,
      customer_email: contactInfo.email,
      customer_phone: contactInfo.phone,
    };
    if (user?.id) orderData.user_id = user.id;

    const orderItems = items.map((item: any) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.selectedPrice,
      ml: item.selectedMl,
    }));

    const orderId = await createOrderTransaction(orderData, orderItems);

    if (orderId) {
      clearCart();
      
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: contactInfo.fullName || 'Cliente',
          total,
          paymentMethod,
          items: items.map((item: any) => ({
            name: `${item.product.name} (${item.selectedMl}ml)`,
            price: item.selectedPrice,
            quantity: item.quantity
          }))
        })
      });

      if (paymentMethod === "transfer") {
        const currentAddress = isNewAddress 
          ? newAddress 
          : addresses.find(a => a.id === selectedAddressId) || newAddress;
          
        const messageRaw = buildWhatsAppMessage(orderId.toString(), items, currentAddress, total);
        const encodedMessage = encodeURIComponent(messageRaw);
        const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573203567144";
        window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, "_blank");
      }
      router.push(`/order-confirmation/${orderId}`);
    } else {
      toast.error("Hubo un error procesando tu pedido.");
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !isPlacingOrder) return null;

  return (
    <div className="min-h-screen bg-cream pt-8 pb-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Stepper visual */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <StepIndicator current={step} target={1} icon={<User className="w-5 h-5" />} label="Información" />
            <div className={`w-16 h-px ${step >= 2 ? 'bg-gold' : 'bg-border'}`} />
            <StepIndicator current={step} target={2} icon={<MapPin className="w-5 h-5" />} label="Envío" />
            <div className={`w-16 h-px ${step >= 3 ? 'bg-gold' : 'bg-border'}`} />
            <StepIndicator current={step} target={3} icon={<CreditCard className="w-5 h-5" />} label="Pago" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Form Area */}
          <div className="flex-1 space-y-4">
            
            {/* Step 1: Información */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <h2 className="font-display text-xl text-charcoal mb-4">Información de Contacto</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                    />
                  </div>
                  {!user && (
                    <div className="mt-4 p-4 rounded-xl border border-border bg-cream flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gold">¿Guardar información?</h4>
                        <p className="text-sm text-charcoal-muted">Crea una cuenta para compras más rápidas en el futuro.</p>
                      </div>
                      <button onClick={() => router.push("/register")} className="text-sm font-medium text-gold hover:underline">Crear cuenta</button>
                    </div>
                  )}
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3 mt-6 rounded-xl font-medium text-white transition-all hover:scale-[1.02] shadow-sm bg-charcoal hover:bg-gold"
                  >
                    Continuar a Envío
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Envío */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <h2 className="font-display text-xl text-charcoal mb-4">Dirección de Envío</h2>
                
                {user && addresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {addresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setIsNewAddress(false); }}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedAddressId === addr.id && !isNewAddress ? 'border-gold bg-cream' : 'border-border bg-white hover:border-gold shadow-sm'}`}
                      >
                        <div className="flex justify-between">
                          <p className="font-medium text-charcoal">{addr.street}</p>
                          {selectedAddressId === addr.id && !isNewAddress && <Check className="w-5 h-5 text-gold" />}
                        </div>
                        <p className="text-sm text-charcoal-muted">{addr.city}, {addr.state}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(isNewAddress || !user || addresses.length === 0) && (
                  <div className="space-y-4 mb-8">
                    {user && addresses.length > 0 && (
                      <h3 className="font-medium text-gold mb-2">Ingresar nueva dirección</h3>
                    )}
                    <input
                      type="text"
                      placeholder="Calle / Carrera / Avenida"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                      className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                        className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Departamento"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                        className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none shadow-sm"
                      />
                    </div>
                    {user && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="accent-gold w-4 h-4" 
                        />
                        <span className="text-sm text-charcoal-muted">Guardar esta dirección para el futuro</span>
                      </label>
                    )}
                  </div>
                )}

                {user && addresses.length > 0 && !isNewAddress && (
                  <button onClick={() => setIsNewAddress(true)} className="text-sm text-gold font-medium mb-8 hover:underline">
                    + Usar otra dirección
                  </button>
                )}

                <h3 className="font-display text-xl text-charcoal mb-4">Método de Envío</h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-gold bg-cream flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-medium text-charcoal">Envío estándar</p>
                      <p className="text-sm text-charcoal-muted">2 a 5 días calendario según transportadora</p>
                    </div>
                    <span className="text-charcoal-muted font-medium text-sm">
                      A cargo del destinatario
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl font-medium text-charcoal border border-border hover:bg-cream shadow-sm transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02] shadow-sm bg-charcoal hover:bg-gold"
                  >
                    Continuar a Pago
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pago */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <h2 className="font-display text-xl text-charcoal mb-4">Método de Pago</h2>
                
                <div className="space-y-4">
                  <PaymentOption 
                    id="transfer" 
                    title="Transferencia Bancaria" 
                    selected={paymentMethod === "transfer"} 
                    onSelect={() => setPaymentMethod("transfer")}
                  >
                    <div className="p-4 bg-cream border border-border rounded-xl text-sm text-charcoal mt-2">
                      <p className="text-xs text-charcoal-muted mb-3">Al confirmar el pedido serás redirigido a WhatsApp para coordinar el pago.</p>
                      <p><strong>Nequi / Bancolombia:</strong> {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "320 356 7144"}</p>
                      <p><strong>Titular:</strong> Bendita Store</p>
                      <p className="mt-2 text-xs text-charcoal-muted">Envía el comprobante por WhatsApp y tu pedido será procesado en menos de 24 horas.</p>
                    </div>
                  </PaymentOption>
                  {items.length === 1 && (
                    <PaymentOption 
                      id="cod" 
                      title="Pago en Casa" 
                      selected={paymentMethod === "cod"} 
                      onSelect={() => setPaymentMethod("cod")}
                    >
                      <div className="p-4 bg-cream border border-border rounded-xl text-sm text-charcoal mt-2">
                        <p>Paga en efectivo al recibir tu pedido. Entrega en 2 a 5 días calendario según transportadora.</p>
                      </div>
                    </PaymentOption>
                  )}
                </div>

                <div className="mt-6 p-4 rounded-xl border border-border bg-cream">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-charcoal mb-1">Garantía del producto</p>
                      <p className="font-body text-xs text-charcoal-muted leading-relaxed">
                        Cubrimos rotura de envase o válvula en mal estado. La garantía aplica únicamente durante las <strong className="text-charcoal">48 horas siguientes a la recepción del paquete</strong>. Te recomendamos revisar el producto al momento de recibirlo y contactarnos de inmediato si detectas algún inconveniente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 rounded-xl font-medium text-charcoal border border-border hover:bg-cream shadow-sm transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2 bg-charcoal hover:bg-gold shadow-sm"
                  >
                    {isPlacingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Pedido"}
                  </button>
                </div>
              </div>
            )}
            
          </div>

          {/* Resumen del Carrito (Sticky) */}
          <div className="lg:w-96">
            <div className="sticky top-28 bg-white rounded-2xl p-6 border border-border shadow-sm">
              <h2 className="font-display text-xl text-charcoal mb-4">Resumen de tu pedido</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar mb-4">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-cream rounded-lg overflow-hidden shrink-0 border border-border">
                      {item.product.images?.[0] ? (
                        <Image src={item.product.images[0]} alt={item.product.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-cream" />
                      )}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full border border-border shadow-sm flex items-center justify-center text-[10px] text-charcoal font-bold">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-charcoal font-semibold text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-charcoal-muted">{item.product.brand?.name} {item.selectedMl ? `| ${item.selectedMl}ml` : ''}</p>
                      <p className="text-gold font-medium text-sm mt-1">
                        ${(item.selectedPrice * item.quantity).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between text-charcoal-muted">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between text-charcoal-muted">
                  <span>Envío</span>
                  <span>A cargo del destinatario</span>
                </div>
                {step === 3 && (
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Método de pago</span>
                    <span className="capitalize">{paymentMethod === 'cod' ? 'Pago en Casa' : 'Transferencia'}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-charcoal font-semibold">Total</span>
                  <span className="font-display text-2xl text-gold">${total.toLocaleString("es-CO")}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helpers

function StepIndicator({ current, target, icon, label }: { current: number, target: number, icon: React.ReactNode, label: string }) {
  const isCompleted = current > target;
  const isActive = current === target;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        isCompleted ? 'bg-gold text-white' : 
        isActive ? 'bg-charcoal text-white shadow-md' : 
        'bg-white border border-border text-charcoal-muted'
      }`}>
        {isCompleted ? <Check className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-charcoal font-semibold' : 'text-charcoal-muted'}`}>
        {label}
      </span>
    </div>
  );
}

function PaymentOption({ id, title, selected, onSelect, children }: { id: string, title: string, selected: boolean, onSelect: () => void, children?: React.ReactNode }) {
  return (
    <div className={`border rounded-xl transition-colors overflow-hidden ${selected ? 'border-gold bg-cream' : 'border-border bg-white shadow-sm'}`}>
      <div 
        onClick={onSelect}
        className="p-4 flex items-center gap-3 cursor-pointer"
      >
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-gold' : 'border-border'}`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
        </div>
        <span className="font-medium text-charcoal">{title}</span>
      </div>
      {selected && children && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
