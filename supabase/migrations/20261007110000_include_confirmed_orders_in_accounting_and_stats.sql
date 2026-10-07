-- =============================================================================
-- Migración: include_confirmed_orders_in_accounting_and_stats
-- 1. Agrega columna updated_at y trigger en la tabla orders
-- 2. Actualiza get_accounting_stats para incluir estado 'confirmed'
-- 3. Actualiza get_admin_dashboard_stats para unificar estados válidos de venta
-- =============================================================================

-- 1. Agregar columna updated_at a orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
UPDATE public.orders SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.orders SET updated_at = now() WHERE id IN ('a36c88fa-89e8-483e-84dd-912bf452c13a', '0861bf0b-a8a5-4ee4-b2b2-7fd2e9282329');

-- 2. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_orders_updated_at();

-- 3. Actualizar función get_accounting_stats
CREATE OR REPLACE FUNCTION public.get_accounting_stats(p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_revenue numeric;
  v_cost numeric;
  v_expenses numeric;
BEGIN
  SELECT COALESCE(SUM(o.total), 0) INTO v_revenue
  FROM orders o
  WHERE o.status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered')
    AND (
      o.created_at::date BETWEEN p_from AND p_to
      OR (o.updated_at IS NOT NULL AND o.updated_at::date BETWEEN p_from AND p_to)
    );

  SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) INTO v_cost
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered')
    AND (
      o.created_at::date BETWEEN p_from AND p_to
      OR (o.updated_at IS NOT NULL AND o.updated_at::date BETWEEN p_from AND p_to)
    )
    AND p.cost_price IS NOT NULL;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses
  WHERE date BETWEEN p_from AND p_to;

  RETURN jsonb_build_object(
    'revenue', v_revenue,
    'cost', v_cost,
    'gross_profit', v_revenue - v_cost,
    'expenses', v_expenses,
    'net_profit', v_revenue - v_cost - v_expenses
  );
END;
$function$;

-- 4. Actualizar función get_admin_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total_orders bigint;
  v_total_revenue numeric;
  v_total_products bigint;
  v_total_users bigint;
  v_pending_orders bigint;
  v_monthly_revenue numeric;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(total), 0)
  INTO v_total_orders, v_total_revenue
  FROM orders
  WHERE status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered');

  SELECT COUNT(*) INTO v_total_products FROM products WHERE is_active = true;
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_pending_orders FROM orders WHERE status = 'pending';

  SELECT COALESCE(SUM(total), 0)
  INTO v_monthly_revenue
  FROM orders
  WHERE status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered')
    AND (
      created_at >= date_trunc('month', now())
      OR (updated_at IS NOT NULL AND updated_at >= date_trunc('month', now()))
    );

  RETURN jsonb_build_object(
    'total_orders', v_total_orders,
    'total_revenue', v_total_revenue,
    'total_products', v_total_products,
    'total_users', v_total_users,
    'pending_orders', v_pending_orders,
    'monthly_revenue', v_monthly_revenue
  );
END;
$function$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.get_accounting_stats(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accounting_stats(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO service_role;
