import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawerDynamic";
import { Toaster } from "react-hot-toast";

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
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-navy-950)",
            color: "var(--color-crystal)",
            border: "1px solid rgba(201, 162, 39, 0.2)", // border-gold-500/20
            backdropFilter: "blur(12px)",
          },
          iconTheme: {
            primary: "var(--color-gold)",
            secondary: "var(--color-navy-950)",
          },
        }}
      />
    </>
  );
}
