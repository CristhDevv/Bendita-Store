import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawerDynamic";
import { Toaster } from "react-hot-toast";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <CartDrawer />
      {/* pt-24 asegura que el contenido no quede oculto detrás del header fijo */}
      <main className="flex-1 flex flex-col pt-24 min-h-screen">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
