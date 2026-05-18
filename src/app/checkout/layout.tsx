import { CartDrawer } from "@/components/cart/CartDrawerDynamic";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartDrawer />
      <main className="min-h-screen bg-cream">
        {children}
      </main>
      <WhatsAppButton />
    </>
  );
}
