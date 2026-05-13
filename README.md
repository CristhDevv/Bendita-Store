# Bendita Store — Perfumería Premium

Bendita Store es una plataforma de comercio electrónico de alta gama especializada en fragancias de lujo. Construida con tecnologías modernas para ofrecer una experiencia rápida, segura y estéticamente superior.

## Tecnologías

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Estilos:** Vanilla CSS & Tailwind CSS
- **Animaciones:** Framer Motion & Lucide React
- **Estado:** Zustand

## Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone <tu-repositorio>
   cd bendita-store
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Variables de Entorno:**
   Copia el archivo `.env.example` a `.env.local` y completa las variables con tus credenciales de Supabase:
   ```bash
   cp .env.example .env.local
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel

Este proyecto está optimizado para desplegarse en Vercel con la mejor latencia para Colombia (Región São Paulo - `gru1`).

1. Crea un nuevo proyecto en [Vercel](https://vercel.com/).
2. Conecta tu repositorio de GitHub.
3. Configura las siguientes variables de entorno en el panel de Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (Ej: https://tu-tienda.vercel.app)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` (Formato: 573XXXXXXXXX)
4. Haz clic en **Deploy**.

## Estructura del Proyecto

- `/src/app`: Rutas de la aplicación (Shop, Account, Admin).
- `/src/components`: Componentes reutilizables organizados por dominio.
- `/src/lib`: Utilidades, configuración y cliente de Supabase.
- `/src/hooks`: Custom hooks para auth y estado.
- `/src/types`: Definiciones de TypeScript.

## Seguridad

La aplicación incluye:
- Cabeceras de seguridad estrictas (X-Frame, CSP, etc.).
- Validación de variables de entorno en tiempo de ejecución.
- Middleware de protección para rutas de Administración y Cuenta.
- RLS (Row Level Security) configurado en Supabase.

---
Hecho con pasión por Bendita Store.
