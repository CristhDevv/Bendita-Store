import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawerDynamic";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { PageViewTracker } from "@/components/layout/PageViewTracker";
import { OrderChangeNotification } from "@/components/ui/OrderChangeNotification";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageViewTracker />
      <OrderChangeNotification />
      <Header />
      <CartDrawer />
      {/* pt-24 asegura que el contenido no quede oculto detrás del header fijo */}
      <main className="flex-1 flex flex-col pt-14 min-h-screen">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
