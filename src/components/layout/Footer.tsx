import { CONFIG } from "@/lib/config";
import Link from "next/link";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-charcoal border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Col 1: Brand */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <Link href="/" className="flex items-center gap-2 text-gold">
              <span className="font-script text-4xl tracking-wide">Bendita Store</span>
            </Link>
            <p className="font-display italic text-white/70 text-lg">
              "Tu esencia, nuestra pasión"
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/bendita_store_perfumes" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-all">
                {/* Instagram SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.facebook.com/share/1HzH2iTptU/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-all">
                {/* Facebook SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <h3 className="font-display font-semibold text-xl text-gold tracking-wide uppercase">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              {["Inicio", "Catálogo", "Marcas", "Ofertas", "Mi Cuenta", "Wishlist"].map((item) => (
                <li key={item}>
                  <Link
                    href={item === "Inicio" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
                    className="text-white/70 hover:text-gold transition-colors text-sm font-body"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <h3 className="font-display font-semibold text-xl text-gold tracking-wide uppercase">
              Atención al Cliente
            </h3>
            <ul className="space-y-4 text-center md:text-left text-sm font-body text-white/70">
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Phone className="w-4 h-4 text-gold" />
                <a href="https://wa.me/573203567144" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  +57 320 356 7144 (WhatsApp)
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail className="w-4 h-4 text-gold" />
                <span>benditastoreperfum@gmail.com</span>
              </li>
              <li className="flex flex-col md:flex-row items-center md:items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-1" />
                <span className="text-center md:text-left">
                  Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                  Envíos a toda Colombia
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-body text-white/50">
          <p>© {new Date().getFullYear()} Bendita Store. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-gold fill-gold" /> en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
