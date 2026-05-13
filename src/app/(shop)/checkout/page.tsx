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
import { CONFIG } from "@/lib/config";

const FREE_SHIPPING_THRESHOLD = 200000;
const EXPRESS_SHIPPING_COST = 15000;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Paso 1: Información
  const [contactInfo, setContactInfo] = useState({ fullName: "", email: "", phone: "" });

  // Paso 2: Envío
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", postal_code: "" });
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Paso 3: Pago
  const [paymentMethod, setPaymentMethod] = useState("transfer");

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
    }
  }, [items, router, isPlacingOrder]);

  const loadAddresses = async (userId: string) => {
    const data = await getUserAddresses(userId);
    setAddresses(data);
    if (data.length > 0) {
      setSelectedAddressId(data[0].id);
    } else {
      setIsNewAddress(true);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0);
  const shippingCost = shippingMethod === "express" ? EXPRESS_SHIPPING_COST : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 10000); // 10000 is default standard if not free
  const total = subtotal + shippingCost;

  const handleNextStep = async () => {
    if (step === 1) {
      if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
        toast.error("Por favor completa toda tu información de contacto.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (isNewAddress) {
        if (!newAddress.street || !newAddress.city || !newAddress.state) {
          toast.error("Por favor completa la dirección de envío.");
          return;
        }
      } else if (!selectedAddressId) {
        toast.error("Selecciona una dirección de envío.");
        return;
      }
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
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
    let notes = `Contacto: ${contactInfo.fullName}, ${contactInfo.email}, ${contactInfo.phone}`;
    if (isNewAddress && (!user || !saveNewAddress)) {
      notes += ` | Envío: ${newAddress.street}, ${newAddress.city}, ${newAddress.state}, ${newAddress.postal_code}`;
    }

    const orderData: Partial<Order> = {
      status: "pending",
      total: total,
      address_id: finalAddressId || undefined,
      payment_method: paymentMethod,
      notes: notes,
    };
    if (user?.id) orderData.user_id = user.id;

    const orderItems = items.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.selectedPrice,
      ml: item.selectedMl,
    }));

    const orderId = await createOrderTransaction(orderData, orderItems);

    if (orderId) {
      clearCart();
      router.push(`/order-confirmation/${orderId}`);
    } else {
      toast.error("Hubo un error procesando tu pedido.");
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !isPlacingOrder) return null;

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Stepper visual */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <StepIndicator current={step} target={1} icon={<User className="w-5 h-5" />} label="Información" />
            <div className={`w-16 h-px ${step >= 2 ? 'bg-gold' : 'bg-gold-500/30'}`} />
            <StepIndicator current={step} target={2} icon={<MapPin className="w-5 h-5" />} label="Envío" />
            <div className={`w-16 h-px ${step >= 3 ? 'bg-gold' : 'bg-gold-500/30'}`} />
            <StepIndicator current={step} target={3} icon={<CreditCard className="w-5 h-5" />} label="Pago" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Form Area */}
          <div className="flex-1 space-y-8">
            
            {/* Step 1: Información */}
            {step === 1 && (
              <div className="bg-navy-900/50 rounded-2xl p-6 lg:p-8 border border-gold-500/20 backdrop-blur-md">
                <h2 className="font-display text-2xl text-crystal mb-6">Información de Contacto</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
                    />
                  </div>
                  {!user && (
                    <div className="mt-4 p-4 rounded-xl border border-gold-500/20 bg-gold-500/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gold">¿Guardar información?</h4>
                        <p className="text-sm text-crystal/60">Crea una cuenta para compras más rápidas en el futuro.</p>
                      </div>
                      <button onClick={() => router.push("/register")} className="text-sm font-medium text-gold hover:underline">Crear cuenta</button>
                    </div>
                  )}
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3 mt-6 rounded-xl font-medium text-navy-950 transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
                  >
                    Continuar a Envío
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Envío */}
            {step === 2 && (
              <div className="bg-navy-900/50 rounded-2xl p-6 lg:p-8 border border-gold-500/20 backdrop-blur-md">
                <h2 className="font-display text-2xl text-crystal mb-6">Dirección de Envío</h2>
                
                {user && addresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {addresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setIsNewAddress(false); }}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedAddressId === addr.id && !isNewAddress ? 'border-gold bg-gold-500/10' : 'border-gold-500/20 bg-navy-950/50 hover:border-gold-500/50'}`}
                      >
                        <div className="flex justify-between">
                          <p className="font-medium text-crystal">{addr.street}</p>
                          {selectedAddressId === addr.id && !isNewAddress && <Check className="w-5 h-5 text-gold" />}
                        </div>
                        <p className="text-sm text-crystal/70">{addr.city}, {addr.state}</p>
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
                      className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                        className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Departamento"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                        className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none"
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
                        <span className="text-sm text-crystal/80">Guardar esta dirección para el futuro</span>
                      </label>
                    )}
                  </div>
                )}

                {user && addresses.length > 0 && !isNewAddress && (
                  <button onClick={() => setIsNewAddress(true)} className="text-sm text-gold font-medium mb-8 hover:underline">
                    + Usar otra dirección
                  </button>
                )}

                <h3 className="font-display text-xl text-crystal mb-4">Método de Envío</h3>
                <div className="space-y-3">
                  <div 
                    onClick={() => setShippingMethod("standard")}
                    className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${shippingMethod === 'standard' ? 'border-gold bg-gold-500/10' : 'border-gold-500/20 bg-navy-950/50'}`}
                  >
                    <div>
                      <p className="font-medium text-crystal">Envío Estándar (3-5 días)</p>
                      <p className="text-sm text-crystal/60">Servientrega o Inter Rapidísimo</p>
                    </div>
                    <span className="text-gold font-semibold">
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? "Gratis" : "$10.000"}
                    </span>
                  </div>
                  <div 
                    onClick={() => setShippingMethod("express")}
                    className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${shippingMethod === 'express' ? 'border-gold bg-gold-500/10' : 'border-gold-500/20 bg-navy-950/50'}`}
                  >
                    <div>
                      <p className="font-medium text-crystal">Envío Express (1-2 días)</p>
                      <p className="text-sm text-crystal/60">Solo para ciudades principales</p>
                    </div>
                    <span className="text-gold font-semibold">$15.000</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl font-medium text-crystal border border-gold-500/30 hover:bg-gold-500/10 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 rounded-xl font-medium text-navy-950 transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
                  >
                    Continuar a Pago
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pago */}
            {step === 3 && (
              <div className="bg-navy-900/50 rounded-2xl p-6 lg:p-8 border border-gold-500/20 backdrop-blur-md">
                <h2 className="font-display text-2xl text-crystal mb-6">Método de Pago</h2>
                
                <div className="space-y-4">
                  <PaymentOption 
                    id="transfer" 
                    title="Transferencia Bancaria" 
                    selected={paymentMethod === "transfer"} 
                    onSelect={() => setPaymentMethod("transfer")}
                  >
                    <div className="p-4 bg-navy-950 rounded-xl border border-gold-500/20 text-sm text-crystal/80 mt-2">
                      <p><strong>Bancolombia Ahorros:</strong> 123-456789-00</p>
                      <p><strong>Titular:</strong> Bendita Store SAS</p>
                      <p><strong>NIT:</strong> 901.234.567-8</p>
                      <p className="mt-2 text-xs text-crystal/60">Enviaremos las instrucciones detalladas a tu correo. Tu pedido será procesado una vez confirmado el pago.</p>
                    </div>
                  </PaymentOption>

                  <PaymentOption 
                    id="nequi" 
                    title="Nequi o Daviplata" 
                    selected={paymentMethod === "nequi"} 
                    onSelect={() => setPaymentMethod("nequi")}
                  >
                    <div className="p-4 bg-navy-950 rounded-xl border border-gold-500/20 text-sm text-crystal/80 mt-2 flex gap-4 items-center">
                      <div className="w-20 h-20 bg-white p-1 rounded">
                        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=nequi:${CONFIG.SITE.WHATSAPP}`} alt="QR Nequi" width={80} height={80} />
                      </div>
                      <div>
                        <p><strong>Número:</strong> {CONFIG.SITE.WHATSAPP.slice(0, 3)} {CONFIG.SITE.WHATSAPP.slice(3, 6)} {CONFIG.SITE.WHATSAPP.slice(6)}</p>
                        <p className="mt-1 text-xs text-crystal/60">Escanea el QR o transfiere al número y envía el comprobante por WhatsApp.</p>
                      </div>
                    </div>
                  </PaymentOption>

                  <PaymentOption 
                    id="cod" 
                    title="Pago Contra Entrega" 
                    selected={paymentMethod === "cod"} 
                    onSelect={() => setPaymentMethod("cod")}
                  >
                    <div className="p-4 bg-navy-950 rounded-xl border border-gold-500/20 text-sm text-crystal/80 mt-2">
                      <p>Paga en efectivo o tarjeta al recibir tu pedido.</p>
                      <p className="text-xs text-gold mt-1">*Solo válido para Bogotá, Medellín y Cali.</p>
                    </div>
                  </PaymentOption>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 rounded-xl font-medium text-crystal border border-gold-500/30 hover:bg-gold-500/10 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="flex-1 py-3 rounded-xl font-medium text-navy-950 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
                  >
                    {isPlacingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Pedido"}
                  </button>
                </div>
              </div>
            )}
            
          </div>

          {/* Resumen del Carrito (Sticky) */}
          <div className="lg:w-96">
            <div className="sticky top-28 bg-navy-900/50 rounded-2xl p-6 border border-gold-500/20 backdrop-blur-md">
              <h2 className="font-display text-xl text-crystal mb-4">Resumen de tu pedido</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar mb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0">
                      {item.product.images?.[0] ? (
                        <Image src={item.product.images[0]} alt={item.product.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-navy-800" />
                      )}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-navy-900 rounded-full border border-gold flex items-center justify-center text-[10px] text-gold font-bold">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-crystal text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-crystal/60">{item.product.brand?.name} {item.selectedMl ? `| ${item.selectedMl}ml` : ''}</p>
                      <p className="text-gold font-medium text-sm mt-1">
                        ${(item.selectedPrice * item.quantity).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gold-500/20 space-y-2 text-sm">
                <div className="flex justify-between text-crystal/80">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between text-crystal/80">
                  <span>Envío</span>
                  {shippingCost === 0 ? (
                    <span className="text-gold">Gratis</span>
                  ) : (
                    <span>${shippingCost.toLocaleString("es-CO")}</span>
                  )}
                </div>
                {step === 3 && (
                  <div className="flex justify-between text-crystal/80">
                    <span>Método de pago</span>
                    <span className="capitalize">{paymentMethod === 'cod' ? 'Contra Entrega' : paymentMethod}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-gold-500/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-crystal">Total</span>
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
        isCompleted ? 'bg-gold text-navy-950' : 
        isActive ? 'bg-gold text-navy-950 shadow-[0_0_15px_rgba(201,162,39,0.4)]' : 
        'bg-navy-950 border border-gold-500/30 text-crystal/50'
      }`}>
        {isCompleted ? <Check className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-gold' : 'text-crystal/50'}`}>
        {label}
      </span>
    </div>
  );
}

function PaymentOption({ id, title, selected, onSelect, children }: { id: string, title: string, selected: boolean, onSelect: () => void, children?: React.ReactNode }) {
  return (
    <div className={`border rounded-xl transition-colors overflow-hidden ${selected ? 'border-gold bg-gold-500/5' : 'border-gold-500/20 bg-navy-950/50'}`}>
      <div 
        onClick={onSelect}
        className="p-4 flex items-center gap-3 cursor-pointer"
      >
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-gold' : 'border-gold-500/50'}`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
        </div>
        <span className="font-medium text-crystal">{title}</span>
      </div>
      {selected && children && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
