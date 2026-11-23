-- =============================================================================
-- Migración de Seguridad: harden_rls_and_pos_sales
-- Fecha: 2026-11-23
-- Descripción:
-- 1. Habilita y refuerza RLS en tablas internas sensibles:
--    - supplies (inventario de insumos y costos)
--    - supply_categories (categorías de insumos)
--    - production_lots (lotes de producción y fletes)
--    - production_lot_items (ítems producidos en lotes)
--    - production_lot_item_supplies (fórmulas e insumos por ítem)
--    - expenses (gastos operativos)
--    - inventory_logs (kardex de inventario)
-- 2. Restringe el acceso exclusivamente a usuarios administradores autenticados.
-- 3. Endurece la función create_pos_sale_transaction contra llamadas no autenticadas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. supplies
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplies_admin_all" ON public.supplies;
CREATE POLICY "supplies_admin_all"
  ON public.supplies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 2. supply_categories
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.supply_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supply_categories_admin_all" ON public.supply_categories;
CREATE POLICY "supply_categories_admin_all"
  ON public.supply_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 3. production_lots
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.production_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_lots_admin_all" ON public.production_lots;
CREATE POLICY "production_lots_admin_all"
  ON public.production_lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 4. production_lot_items
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.production_lot_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_lot_items_admin_all" ON public.production_lot_items;
CREATE POLICY "production_lot_items_admin_all"
  ON public.production_lot_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 5. production_lot_item_supplies
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.production_lot_item_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_lot_item_supplies_admin_all" ON public.production_lot_item_supplies;
CREATE POLICY "production_lot_item_supplies_admin_all"
  ON public.production_lot_item_supplies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 6. expenses
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_admin_all" ON public.expenses;
CREATE POLICY "expenses_admin_all"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 7. inventory_logs
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_logs_admin_all" ON public.inventory_logs;
CREATE POLICY "inventory_logs_admin_all"
  ON public.inventory_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 8. Endurecimiento de la función RPC create_pos_sale_transaction
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_pos_sale_transaction(
  p_sale jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_order_id uuid;
  v_pos_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
BEGIN
  v_caller_id := auth.uid();

  -- Control de acceso estricto: requiere autenticación y rol de administrador
  -- A menos que la llamada provenga directamente del rol interno service_role
  IF current_user <> 'service_role' THEN
    IF v_caller_id IS NULL THEN
      RAISE EXCEPTION 'Acceso denegado: llamada no autenticada';
    END IF;

    SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_caller_id;
    IF v_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Acceso denegado: solo administradores pueden registrar ventas POS';
    END IF;
  END IF;

  -- 1. Crear orden vinculada
  INSERT INTO orders (
    user_id,
    status,
    total,
    payment_method,
    notes,
    source,
    customer_name,
    customer_phone
  )
  VALUES (
    NULLIF(p_sale->>'customer_id', '')::uuid,
    'delivered',
    (p_sale->>'total')::numeric,
    p_sale->>'payment_method',
    COALESCE(NULLIF(p_sale->>'notes', ''), 'Venta POS por canal ' || (p_sale->>'channel')),
    'pos',
    NULLIF(p_sale->>'customer_name', ''),
    NULLIF(p_sale->>'customer_phone', '')
  )
  RETURNING id INTO v_order_id;

  -- 2. Crear items en order_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::uuid;
    v_qty := (v_item->>'quantity')::int;

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price,
      ml
    )
    VALUES (
      v_order_id,
      v_product_id,
      v_qty,
      (v_item->>'final_price')::numeric,
      NULLIF(v_item->>'ml', '')::int
    );
  END LOOP;

  -- 3. Crear registro en pos_sales
  INSERT INTO pos_sales (
    channel,
    customer_id,
    customer_name,
    customer_phone,
    payment_method,
    subtotal,
    discount,
    total,
    notes,
    created_by,
    order_id
  )
  VALUES (
    p_sale->>'channel',
    NULLIF(p_sale->>'customer_id', '')::uuid,
    NULLIF(p_sale->>'customer_name', ''),
    NULLIF(p_sale->>'customer_phone', ''),
    p_sale->>'payment_method',
    (p_sale->>'subtotal')::numeric,
    COALESCE((p_sale->>'discount')::numeric, 0),
    (p_sale->>'total')::numeric,
    NULLIF(p_sale->>'notes', ''),
    COALESCE(v_caller_id, NULLIF(p_sale->>'created_by', '')::uuid),
    v_order_id
  )
  RETURNING id INTO v_pos_sale_id;

  -- 4. Crear items en pos_sale_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO pos_sale_items (
      pos_sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      discount,
      final_price
    )
    VALUES (
      v_pos_sale_id,
      NULLIF(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      COALESCE((v_item->>'discount')::numeric, 0),
      (v_item->>'final_price')::numeric
    );
  END LOOP;

  RETURN jsonb_build_object(
    'pos_sale_id', v_pos_sale_id,
    'order_id', v_order_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_pos_sale_transaction(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pos_sale_transaction(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pos_sale_transaction(jsonb, jsonb) TO service_role;
