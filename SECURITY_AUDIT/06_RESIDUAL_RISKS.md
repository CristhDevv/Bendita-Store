# 06 — Riesgos Residuales, Limitaciones y Plan de Acción Priorizado

**Auditor:** Chief Information Security Officer (CISO) & Application Security Architect  
**Fecha:** 2026-11-23  
**Clasificación:** Confidencial / Estratégico  

---

## 1. Declaración de Riesgos Residuales

El proceso de hardening implementó defensas perimetrales, validaciones de entrada, parches de dependencias y políticas de base de datos en código. Sin embargo, existen riesgos residuales que requieren intervención manual del administrador de la plataforma, credenciales de infraestructura o decisiones arquitectónicas de largo plazo.

---

## 2. Matriz de Riesgos Residuales

| ID | Riesgo Residual | Severidad | Acción Requerida | Responsable |
| :--- | :--- | :--- | :--- | :--- |
| **RR-01** | Aplicación efectiva de la migración RLS en la base de datos de producción | **ALTA** | Ejecutar el archivo de migración en el SQL Editor de Supabase | Administrador BD |
| **RR-02** | Rotación de Clave API de Gemini expuesta en proyecto satélite `misapuntesu` | **ALTA** | Revocar en Google AI Studio y migrar a variable de backend | Desarrollador |
| **RR-03** | Exposición de `cost_price` en consulta `products` vía API anon | **MEDIA** | Crear vista pública o restringir columna a nivel PostgreSQL | Administrador BD |
| **RR-04** | Rate Limiting distribuido en múltiples nodos Serverless de Vercel | **BAJA** | Conectar `@upstash/ratelimit` con Redis para sincronización global | DevSecOps |
| **RR-05** | Activación de Autenticación de Dos Factores (MFA / 2FA) para Administradores | **MEDIA** | Forzar TOTP en Supabase Auth para usuarios con `is_admin = true` | CISO / Admin |

---

## 3. Detalle Técnico de los Riesgos y Plan de Acción

### RR-01: Aplicación de la Migración RLS en Producción Supabase (ALTA)
- **Descripción:**
  Se ha generado el script SQL completo en:
  `c:\Users\USER\Desktop\workspace\benditastore\supabase\migrations\20261123150000_harden_rls_and_pos_sales.sql`
  Dado que la base de datos de producción es un entorno vivo con ventas activas y las herramientas de CLI requieren el token de gestión de Supabase o acceso manual al panel, esta migración debe aplicarse en la consola oficial.
- **Acción Inmediata Requerida:**
  1. Abrir el panel de control de Supabase: `https://supabase.com/dashboard/project/vtnmuphfaxjiziknchnk`.
  2. Ir al apartado **SQL Editor**.
  3. Pegar y ejecutar el contenido de `20261123150000_harden_rls_and_pos_sales.sql`.
  4. Verificar que las tablas `supplies`, `production_lots`, etc., tengan habilitado el switch de RLS.

---

### RR-02: Rotación de Clave API de Google Gemini en `misapuntesu` (ALTA)
- **Descripción:**
  La clave presente en `misapuntesu\.env` (`NEXT_PUBLIC_GEMINI_API_KEY`) estuvo configurada para empaquetarse en el cliente web.
- **Acción Inmediata Requerida:**
  1. Ingresar a Google AI Studio (`aistudio.google.com`) o Google Cloud Console.
  2. Eliminar la clave comprometida identificada en el proyecto.
  3. Generar un nuevo API Key con restricciones de cuota y presupuesto.
  4. Renombrar la variable a `GEMINI_API_KEY` (sin el prefijo `NEXT_PUBLIC_`) y asegurar que todas las llamadas a la IA se realicen exclusivamente a través de Server Actions o Route Handlers de Next.js en el backend.

---

### RR-03: Ocultamiento de la Columna `cost_price` en el Catálogo Público (MEDIA)
- **Descripción:**
  Actualmente la tabla `products` permite lectura pública para alimentar el catálogo de compras de los clientes. Aunque la interfaz web no muestra el campo `cost_price` (precio de compra a mayorista), la API REST de Supabase devuelve dicho campo si un usuario anónimo lo solicita explícitamente en el parámetro `?select=`.
- **Recomendación Técnica:**
  - Crear una vista de base de datos `public_products` que seleccione únicamente las columnas públicas (`id, name, slug, description, price, wholesale_price, images, stock, category_id, brand_id, is_active, show_in_catalog`) y conceder permisos públicos solo a dicha vista.
  - Alternativamente, aplicar `REVOKE SELECT (cost_price, stock_alert_threshold) ON public.products FROM anon;`.

---

### RR-04: Transición a Rate Limiting Distribuido con Redis (BAJA)
- **Descripción:**
  La solución implementada en `middleware.ts` opera con un mapa de ventana deslizante en memoria del proceso Node.js. En Vercel, al escalar horizontalmente en múltiples regiones Anycast, cada instancia Edge mantiene su propia ventana en memoria.
- **Recomendación Técnica:**
  - Para alta concurrencia o mitigación de ataques distribuidos coordinados, se sugiere vincular la librería `@upstash/ratelimit` junto con una instancia de Redis Serverless gratuita en Upstash, sincronizando las peticiones de todas las regiones perimetrales en tiempo real.

---

### RR-05: Habilitación de MFA/2FA para Cuentas Administrativas (MEDIA)
- **Descripción:**
  Los administradores de Bendita Store tienen acceso a liquidaciones de caja POS, anulación de órdenes y modificación de precios. Una contraseña filtrada o reutilizada por un operador podría comprometer el backoffice.
- **Recomendación Técnica:**
  - En la configuración de **Supabase Auth > MFA**, habilitar la opción de autenticación en dos pasos mediante aplicaciones TOTP (Google Authenticator, Microsoft Authenticator) y requerir enrolamiento obligatorio para cualquier perfil donde `is_admin = true`.
