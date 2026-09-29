-- =============================================================================
-- Migración: fix_orders_rls_and_pos_sales_rpc
-- 1. Políticas RLS para administración de orders y order_items (UPDATE, DELETE, INSERT)
-- 2. Función atómica create_pos_sale_transaction para registro de ventas POS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Políticas RLS sobre orders
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE
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

DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "orders_admin_insert" ON public.orders;
CREATE POLICY "orders_admin_insert"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 2. Políticas RLS sobre order_items
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "order_items_admin_update" ON public.order_items;
CREATE POLICY "order_items_admin_update"
  ON public.order_items
  FOR UPDATE
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

DROP POLICY IF EXISTS "order_items_admin_delete" ON public.order_items;
CREATE POLICY "order_items_admin_delete"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "order_items_admin_insert" ON public.order_items;
CREATE POLICY "order_items_admin_insert"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Función RPC create_pos_sale_transaction
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
  -- Verificar si el usuario que llama es administrador (si viene con token de usuario)
  v_caller_id := auth.uid();
  IF v_caller_id IS NOT NULL THEN
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

GRANT EXECUTE ON FUNCTION public.create_pos_sale_transaction(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pos_sale_transaction(jsonb, jsonb) TO service_role;
