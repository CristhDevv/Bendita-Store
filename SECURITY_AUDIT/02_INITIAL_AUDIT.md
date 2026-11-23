# 02 — Diagnóstico Inicial y Auditoría de Vulnerabilidades

**Auditor:** Equipo de Seguridad Defensiva y Pentesting  
**Fecha de Diagnóstico:** 2026-11-23  
**Marco de Referencia:** OWASP Top 10:2021, OWASP API Security Top 10, ASVS Nivel 2  
**Estado:** Diagnóstico completado, categorizado por severidad CVSS v3.1  

---

## 1. Cuadro Resumen de Vulnerabilidades Detectadas

| ID | Categoría | Vulnerabilidad | Severidad | Estado Inicial |
| :--- | :--- | :--- | :--- | :--- |
| **VULN-01** | OWASP A01: Broken Access Control | Tablas internas de Supabase sin RLS (`supplies`, `production_lots`, etc.) | **CRÍTICA** (CVSS 9.1) | No Mitigada |
| **VULN-02** | OWASP A01: Broken Access Control | Verificación nula defectuosa en RPC `create_pos_sale_transaction` | **ALTA** (CVSS 8.2) | No Mitigada |
| **VULN-03** | OWASP A03: Injection | Inyección de HTML / Email Spoofing en plantillas de notificación (`notify.ts`) | **ALTA** (CVSS 7.5) | No Mitigada |
| **VULN-04** | OWASP A06: Vulnerable Components | DoS por consumo de CPU/Memoria en dependencias `zod` y `ws` | **ALTA** (CVSS 7.5) | No Mitigada |
| **VULN-05** | OWASP A05: Security Misconfiguration | Cabeceras de seguridad web incompletas (Falta HSTS, COOP, CORP) | **MEDIA** (CVSS 5.3) | No Mitigada |
| **VULN-06** | OWASP A04: Insecure Design | Ausencia de Rate Limiting y bloqueo de scanners automatizados en API | **MEDIA** (CVSS 6.5) | No Mitigada |
| **VULN-07** | OWASP A01: Broken Access Control | Exposición de `cost_price` y umbral de inventario en endpoint público de productos | **MEDIA** (CVSS 5.3) | Requiere Política RLS |
| **VULN-08** | OWASP A07: Identification & Auth | Fuga de clave API de Google Gemini en variable de frontend (`misapuntesu`) | **ALTA** (CVSS 7.4) | Proyecto Satélite |

---

## 2. Análisis Técnico Detallado por Vulnerabilidad

### VULN-01: Exposición de Tablas Internas en Supabase por Ausencia de RLS (CRÍTICA)
- **Componente Afectado:** Supabase PostgreSQL (`vtnmuphfaxjiziknchnk`), API REST (`/rest/v1/*`).
- **Tablas Evaluadas:**
  - `supplies`: Contiene 58 registros con nombres de materias primas, costos unitarios, cantidades en bodega y notas de proveedores.
  - `supply_categories`: 5 registros expuestos.
  - `production_lots`: Registros de lotes con costos de flete, notas de producción y lotes activos.
  - `production_lot_items`: Ítems asociados a lotes.
  - `production_lot_item_supplies`: Fórmulas y consumo de insumos por producto terminado.
- **Evidencia Técnica:**
  Una solicitud HTTP GET enviada al endpoint REST de Supabase utilizando únicamente la clave pública anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) retornó código HTTP `200 OK` / `206 Partial Content` con el listado íntegro de insumos:
  ```http
  GET /rest/v1/supplies?select=*&limit=2 HTTP/1.1
  Host: vtnmuphfaxjiziknchnk.supabase.co
  apikey: <ANON_KEY>
  Authorization: Bearer <ANON_KEY>

  HTTP/1.1 206 Partial Content
  Content-Range: 0-1/58
  Content-Type: application/json

  [
    {"id":"...","name":"Alcohol De Perfumeria","quantity":39.5,"cost":12000,...},
    {"id":"...","name":"Envase 100ml Vidrio","quantity":140,"cost":4500,...}
  ]
  ```
- **Prueba de Escritura Anónima:**
  Durante la verificación, se comprobó que `production_lot_items` admitía operaciones directas de `INSERT` y `DELETE` sin sesión de usuario, permitiendo a cualquier actor en internet insertar o destruir registros de lotes industriales.
- **Impacto:** Fuga total de secretos comerciales, fórmulas de costos, márgenes de ganancia y riesgo inminente de sabotaje o alteración no autorizada del inventario.

---

### VULN-02: Defecto de Autorización en Stored Procedure `create_pos_sale_transaction` (ALTA)
- **Componente Afectado:** Función PL/pgSQL `public.create_pos_sale_transaction(jsonb, jsonb)`.
- **Ubicación:** `supabase/migrations/20260928220000_fix_orders_rls_and_pos_sales_rpc.sql`, líneas 122-128.
- **Vulnerabilidad en el Código:**
  ```sql
  v_caller_id := auth.uid();
  IF v_caller_id IS NOT NULL THEN
    SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_caller_id;
    IF v_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Acceso denegado: solo administradores pueden registrar ventas POS';
    END IF;
  END IF;
  ```
- **Mecanismo del Fallo:**
  Si la función es invocada en un contexto donde `auth.uid()` es nulo (por ejemplo, si un permiso es modificado accidentalmente o se invoca sin sesión JWT válida), la condición `IF v_caller_id IS NOT NULL` evalúa a falso. El bloque de validación se omite por completo y la función ejecuta la creación de la venta y la orden con privilegios de `SECURITY DEFINER`.
- **Impacto:** Creación de ventas fantasmas y decremento de inventario sin autorización de administrador.

---

### VULN-03: Inyección de HTML y Spoofing de Correos en Acciones de Notificación (ALTA)
- **Componente Afectado:** `src/lib/actions/notify.ts` y `src/app/api/notify-order/route.ts`.
- **Vulnerabilidad en el Código:**
  Las variables enviadas desde el checkout del cliente (`customer_name`, `order_id`, `payment_method`, `item.name`) se concatenaban directamente dentro de cadenas HTML destinadas al servicio de mensajería Resend:
  ```typescript
  // CÓDIGO VULNERABLE ANTERIOR:
  html: `
    <h2>Nuevo Pedido #${order.id}</h2>
    <p>Cliente: ${order.customer_name}</p>
    <ul>${order.items.map(i => `<li>${i.name}</li>`)}</ul>
  `
  ```
- **Mecanismo de Explotación:**
  Un atacante que realice un pedido en la tienda puede ingresar en el campo `Nombre del Cliente` un payload HTML malicioso (por ejemplo: `<a href="https://phishing.site">Haga clic aquí para verificar el pago</a>` o etiquetas de redirección/spoofing). El correo transaccional recibido por el administrador de la tienda contendrá el HTML arbitrario inyectado.
- **Impacto:** Ataques dirigidos de phishing interno contra los administradores de la tienda, desfiguración de notificaciones y potencial robo de credenciales administrativas.

---

### VULN-04: Vulnerabilidades en Dependencias Directas y Transitivas (ALTA)
- **Componente Afectado:** `package.json` / `node_modules` (`zod`, `ws`).
- **Registros de Vulnerabilidad Oficiales:**
  - **`ws` < 8.21.0:** GHSA-96hv-2xvq-fx4p (Alta). Agotamiento de recursos y denegación de servicio (DoS) mediante el envío de tramas WebSocket maliciosas que desbordan la memoria del servidor o provocan caídas del proceso Node.js.
  - **`zod` < 4.6.6:** GHSA-mrhx-c7xc-m3w5 (Alta). Procesamiento inseguro de esquemas recursivos o expresiones regulares maliciosas provocando bloqueo del bucle de eventos (Event Loop Stall) y colapso de memoria.
- **Impacto:** Denegación de servicio no autenticada en el servidor de la aplicación.

---

### VULN-05: Configuración Incompleta de Cabeceras HTTP de Seguridad (MEDIA)
- **Componente Afectado:** `next.config.ts`.
- **Estado Inicial:**
  - Ausencia de `Strict-Transport-Security` (HSTS) con indicador `preload` y `includeSubDomains`.
  - Ausencia de `Cross-Origin-Opener-Policy` (COOP) permitiendo ataques de tipo Spectre o fugas de ventanas entre orígenes.
  - Ausencia de `Cross-Origin-Resource-Policy` (CORP) restringiendo la inclusión de recursos en sitios de terceros.
  - Ausencia de directiva `upgrade-insecure-requests` en la política CSP.

---

### VULN-06: Falta de Filtrado Perimetral, Bloqueo de Scanners y Rate Limiting (MEDIA)
- **Componente Afectado:** `middleware.ts`.
- **Estado Inicial:**
  - El middleware solo realizaba redirección básica a `/login` para rutas `/admin/*` y `/account/*`.
  - Los endpoints de API (`/api/notify-order`) no contaban con límite de tasa de solicitudes (rate limiting).
  - Cualquier herramienta de escaneo de vulnerabilidades (`sqlmap`, `nikto`, `masscan`, `wpscan`, `gobuster`) podía interactuar libremente con el servidor sin penalización perimetral.
  - No existía bloqueo inmediato de sondas típicas que buscan archivos como `.env`, `.git/config`, `wp-login.php` o rutas de traversal `../`.

---

### VULN-07: Exposición de Costos Comerciales en Consulta Pública de Productos (MEDIA)
- **Componente Afectado:** Tabla `public.products` en Supabase.
- **Hallazgo:**
  La política RLS de lectura de `products` permite `SELECT` para el rol `anon` sobre toda la fila. Aunque el frontend de Bendita Store no renderiza `cost_price` a los compradores, un actor malicioso puede consultar la API REST de Supabase directamente pidiendo `select=name,cost_price,stock_alert_threshold` y conocer exactamente el costo de adquisición de cada producto y los márgenes brutos de la tienda.

---

### VULN-08: Clave de API de Gemini Expuesta en Frontend de Mis Apuntes U (ALTA)
- **Componente Afectado:** Proyecto satélite `c:\Users\USER\Desktop\workspace\misapuntesu\.env`.
- **Hallazgo:**
  La variable `NEXT_PUBLIC_GEMINI_API_KEY` contiene una clave de API de Google Gemini activa de 55 caracteres. Al utilizar el prefijo `NEXT_PUBLIC_`, Next.js incluye dicha clave en los bundles de JavaScript generados para el navegador del usuario final, permitiendo a cualquier visitante extraerla y agotar la cuota de la API o generar cargos económicos no autorizados.
