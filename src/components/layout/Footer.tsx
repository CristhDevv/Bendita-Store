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
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-all">
                {/* Instagram SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-all">
                {/* Facebook SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-all">
                {/* TikTok SVG */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 0012.67-1.39V8.67a8.31 8.31 0 004.77 1.52v-3.4a4.85 4.85 0 01-2.85-.1z" />
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
                <a href={`https://wa.me/${CONFIG.SITE.WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  +{CONFIG.SITE.WHATSAPP.slice(0, 2)} {CONFIG.SITE.WHATSAPP.slice(2, 5)} {CONFIG.SITE.WHATSAPP.slice(5, 8)} {CONFIG.SITE.WHATSAPP.slice(8)} (WhatsApp)
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail className="w-4 h-4 text-gold" />
                <span>hola@benditastore.com</span>
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
