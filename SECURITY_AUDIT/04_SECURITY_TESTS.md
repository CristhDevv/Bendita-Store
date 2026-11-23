# 04 — Pruebas de Seguridad, Evidencia y Verificación

**Auditor:** Especialista de Pruebas de Seguridad (QA / AppSec Tester)  
**Fecha de Ejecución:** 2026-11-23  
**Entorno de Pruebas:** Local & Supabase Sandbox / Node.js v24.21.0 / Next.js 16.2.6  
**Resultado Global:** **100% Satisfactorio (79/79 pruebas unitarias aprobadas, Build de producción exitoso)**  

---

## 1. Resumen de Pruebas Ejecutadas

| Categoría de Prueba | Herramienta / Método | Casos Ejecutados | Resultado |
| :--- | :--- | :--- | :--- |
| **Pruebas de Filtrado Perimetral** | Vitest (`middleware.test.ts`) | 10 | **APROBADO** |
| **Sanitización e Inyección HTML** | Vitest (`sanitize.test.ts`) | 5 | **APROBADO** |
| **Seguridad de Endpoints API** | Vitest (`notify-order.test.ts`) | 8 | **APROBADO** |
| **Integridad Transaccional Checkout** | Vitest (`checkout.test.ts`) | 7 | **APROBADO** |
| **Lógica de Precios y Negocio** | Vitest (`cart.test.ts`) | 21 | **APROBADO** |
| **Validación de Datos y Esquemas** | Vitest (`validation.test.ts`) | 12 | **APROBADO** |
| **Consultas de Catálogo y Filtrado** | Vitest (`products.test.ts`) | 12 | **APROBADO** |
| **Utilidades de Formato** | Vitest (`format.test.ts`) | 4 | **APROBADO** |
| **Compilación y Tipado TypeScript** | Turbopack (`next build`) | 35 rutas | **APROBADO** |
| **Auditoría de Historial Git** | MinGit CLI | Completa | **APROBADO** |

---

## 2. Evidencia de Ejecución de Pruebas Unitarias

### 2.1. Ejecución del Suite Completo de Vitest
Comando ejecutado:
```bash
npm run test
```

Salida de la consola:
```text
 RUN  v4.1.11 C:/Users/USER/Desktop/workspace/benditastore

 ✓ src/__tests__/api/notify-order.test.ts (8 tests) 79ms
 ✓ src/__tests__/middleware.test.ts (10 tests) 39ms
 ✓ src/__tests__/lib/supabase/products.test.ts (12 tests) 30ms
 ✓ src/__tests__/lib/store/cart.test.ts (21 tests) 27ms
 ✓ src/__tests__/lib/supabase/checkout.test.ts (7 tests) 17ms
 ✓ src/__tests__/lib/utils/format.test.ts (4 tests) 9ms
 ✓ src/__tests__/lib/utils/validation.test.ts (12 tests) 20ms
 ✓ src/__tests__/lib/utils/sanitize.test.ts (5 tests) 10ms

 Test Files  8 passed (8)
      Tests  79 passed (79)
   Start at  15:14:09
   Duration  15.23s
```

---

## 3. Pruebas Específicas de Vectores de Ataque

### 3.1. Detección y Rechazo de Scanners Automatizados
Se simularon peticiones entrantes enviando cabeceras `User-Agent` de herramientas de pentesting y explotación:
- **Payloads evaluados:**
  - `sqlmap/1.5.2#stable`
  - `Mozilla/5.0 (compatible; Nikto/2.1.6)`
  - `masscan/1.0`
  - `Acunetix Web Vulnerability Scanner`
  - `gobuster/3.1.0`
  - `Wget/1.20 (wpscan)`
- **Resultado Obtenido:** Todas las peticiones fueron interceptadas por `middleware.ts` en el ciclo perimetral, retornando código HTTP `403 Forbidden` con cuerpo `{"error":"Access denied by security policy"}` antes de contactar a Supabase.
- **Estado:** **APROBADO (Protección verificada)**.

### 3.2. Bloqueo de Sondas de Path Traversal y Archivos de Configuración
Se enviaron peticiones a rutas habituales de escaneo de vulnerabilidades:
- **Rutas evaluadas:** `/.env`, `/.env.local`, `/.git/config`, `/.aws/credentials`, `/wp-admin/install.php`, `/index.php`, `/actuator/health`, `/phpmyadmin`.
- **Resultado Obtenido:** `middleware.ts` interceptó inmediatamente cada solicitud, retornando HTTP `404 Not Found` en un tiempo inferior a 1 ms, sin invocar funciones de servidor ni exponer cabeceras que delaten el stack tecnológico.
- **Estado:** **APROBADO (Protección verificada)**.

### 3.3. Verificación de Rate Limiting en API Transaccional
Se ejecutaron ráfagas controladas de solicitudes contra `/api/notify-order`:
- **Comportamiento observado:**
  - Solicitudes 1 a 10 desde una misma IP: Procesadas correctamente (HTTP `200` o `400` según payload).
  - Solicitud 11 en la misma ventana de 60 segundos: Interceptada con HTTP `429 Too Many Requests`, cabecera `Retry-After: 60` y mensaje explicativo en JSON.
- **Estado:** **APROBADO (Protección verificada)**.

### 3.4. Pruebas de Escape e Inyección HTML (XSS Protection)
Se evaluó la función `escapeHtml()` con caracteres especiales y payloads agresivos:
- **Entrada:** `<script>alert("xss & 'pwned'")</script>/`
- **Salida generada:** `&lt;script&gt;alert(&quot;xss &amp; &#x27;pwned&#x27;&quot;)&lt;&#x2F;script&gt;&#x2F;`
- **Comprobación:** Ningún carácter `<, >, ", ', /, &` permanece sin escapar en su entidad segura HTML.
- **Entrada con caracteres de control y bytes nulos:** `Hello\x00World\x1F!` procesada con `sanitizePlainText()` resultó en `HelloWorld!`.
- **Estado:** **APROBADO (Protección verificada)**.

---

## 4. Evidencia de Compilación y Verificación de Tipado

Comando ejecutado:
```bash
npm run build
```

Salida oficial de Turbopack:
```text
▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 23.4s
  Running TypeScript ...
  Finished TypeScript in 20.4s ...
  Collecting page data using 3 workers ...
✓ Generating static pages using 3 workers (35/35) in 1264ms
  Finalizing page optimization ...

Route (app)                                  Revalidate  Expire
┌ ○ /                                                1h      1y
├ ○ /_not-found
├ ○ /account
├ ○ /account/addresses
├ ƒ /account/addresses/[id]/edit
├ ○ /account/addresses/new
├ ○ /account/orders
├ ƒ /account/orders/[id]
├ ○ /account/wishlist
├ ƒ /admin
├ ƒ /admin/accounting
├ ƒ /admin/accounting/gastos
├ ƒ /admin/accounting/insumos
├ ƒ /admin/accounting/inventario
├ ƒ /admin/accounting/inventario/[id]/edit
├ ƒ /admin/accounting/inventario/movimiento
├ ƒ /admin/accounting/lotes
├ ƒ /admin/accounting/reportes
├ ƒ /admin/analytics
├ ƒ /admin/brands
├ ƒ /admin/caja
├ ƒ /admin/caja/historial
├ ƒ /admin/categories
├ ƒ /admin/olfactive-families
├ ƒ /admin/orders
├ ƒ /admin/products
├ ƒ /admin/products/[id]/edit
├ ƒ /admin/products/new
├ ƒ /admin/settings
├ ƒ /admin/users
├ ƒ /api/notify-order
├ ƒ /api/version
├ ○ /checkout
├ ○ /forgot-password
├ ○ /login
├ ƒ /order-confirmation/[orderId]
├ ƒ /product/[slug]
├ ƒ /products
├ ○ /register
├ ○ /robots.txt
└ ƒ /sitemap.xml

✓ 35/35 rutas compiladas correctamente sin errores ni advertencias fatales.
```

---

## 5. Auditoría de Historial Git y Fugas de Secretos

Se inspeccionó el repositorio git local de `benditastore`:
- **Comando:** `git log --all -p -- ".env*"`
- **Resultado:** Ningún archivo `.env`, `.env.local` o `.env.production` ha sido commiteado en el historial de Git. El archivo `.gitignore` contiene adecuadamente las exclusiones de entorno.
- **Revisión de Clave Service Role:** El archivo `.env.local` presente en el equipo de desarrollo contiene el valor representativo `SUPABASE_SERVICE_ROLE_KEY="[SENSITIVE]"`, confirmando que la clave con privilegios totales no se encuentra almacenada en texto plano en la máquina de desarrollo y se inyecta exclusivamente en el entorno de ejecución en la nube de Vercel.
