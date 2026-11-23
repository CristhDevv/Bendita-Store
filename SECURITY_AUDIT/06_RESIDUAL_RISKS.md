# 06 — Riesgos Residuales, Limitaciones y Plan de Acción Priorizado

**Auditor:** Chief Information Security Officer (CISO) & Application Security Architect  
**Fecha:** 2026-11-23  
**Clasificación:** Confidencial / Estratégico  

---

## 1. Declaración de Riesgos Residuales

El proceso de hardening implementó defensas perimetrales, validaciones de entrada, parches de dependencias y políticas de base de datos en código. Sin embargo, existen riesgos residuales que requieren intervención manual del administrador de la plataforma, credenciales de infraestructura o decisiones arquitectónicas de largo plazo.

---

## 2. Matriz de Riesgos Residuales

| ID | Riesgo Residual | Severidad | Estado | Responsable |
| :--- | :--- | :--- | :--- | :--- |
| **RR-01** | Aplicación efectiva de la migración RLS en la base de datos de producción | **ALTA** | **MITIGADO Y VERIFICADO** | Ejecutado vía Management API |
| **RR-02** | Rotación de Clave API de Gemini expuesta en proyecto satélite `misapuntesu` | **ALTA** | Pendiente | Desarrollador |
| **RR-03** | Exposición de `cost_price` en consulta `products` vía API anon | **MEDIA** | Pendiente | Administrador BD |
| **RR-04** | Rate Limiting distribuido en múltiples nodos Serverless de Vercel | **BAJA** | Pendiente | DevSecOps |
| **RR-05** | Activación de Autenticación de Dos Factores (MFA / 2FA) para Administradores | **MEDIA** | Pendiente | CISO / Admin |

---

## 3. Detalle Técnico de los Riesgos y Plan de Acción

### RR-01: Aplicación de la Migración RLS en Producción Supabase (ESTADO: COMPLETADO)
- **Ejecución y Verificación:**
  La migración `20261123150000_harden_rls_and_pos_sales.sql` fue ejecutada de forma remota y autorizada contra el proyecto `vtnmuphfaxjiziknchnk` de Supabase a través de la Management API (código HTTP 201).
- **Resultados de Verificación en Vivo:**
  - `supplies`: RLS activo, consultas anónimas retornan 0 registros y los intentos de escritura son rechazados con error PostgreSQL `42501 (violates row-level security policy)`.
  - `supply_categories`, `production_lots`, `production_lot_items`, `production_lot_item_supplies`, `expenses`, `inventory_logs`: RLS activo y blindado contra accesos públicos.
  - `create_pos_sale_transaction`: Invocaciones anónimas o sin credenciales de administrador son rechazadas inmediatamente con excepción `P0001 (Acceso denegado: llamada no autenticada)`.

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
