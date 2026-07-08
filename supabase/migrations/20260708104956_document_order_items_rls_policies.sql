-- =============================================================================
-- MIGRACIÓN RETROACTIVA — SOLO DOCUMENTACIÓN
-- Estas políticas ya existen en producción. Fueron creadas manualmente
-- desde el panel de Supabase y se documentan aquí para mantener trazabilidad
-- en el historial de git.
--
-- ⚠ NO EJECUTAR en producción sin verificar primero que las políticas
-- no existan ya. CREATE POLICY falla si el nombre ya está en uso.
-- Verificar con:
--   SELECT policyname FROM pg_policies WHERE tablename = 'order_items';
-- =============================================================================

-- Política 1: SELECT para rol authenticated (administradores)
-- Condición: el usuario autenticado tiene is_admin = true en la tabla profiles.
CREATE POLICY "order_items_admin_select"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Política 2: INSERT para rol public (usuarios propietarios del pedido)
-- Condición: el user_id del pedido padre coincide con el usuario autenticado.
-- Nota: usa rol 'public' a diferencia de la política de admin que usa 'authenticated'.
-- Esta inconsistencia existe en producción y se documenta tal cual, sin corregir.
CREATE POLICY "order_items_own_insert"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Política 3: SELECT para rol public (usuarios propietarios del pedido)
-- Condición: el user_id del pedido padre coincide con el usuario autenticado.
-- Nota: igual que la política de INSERT, usa rol 'public'.
CREATE POLICY "order_items_own_select"
  ON public.order_items
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );
