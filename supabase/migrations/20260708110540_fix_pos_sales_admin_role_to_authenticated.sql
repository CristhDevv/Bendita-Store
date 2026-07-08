-- =============================================================================
-- CORRECCIÓN DE ROL: public → authenticated en políticas admin de POS
--
-- Esta migración corrige una inconsistencia de rol detectada en auditoría de
-- RLS: las políticas de administrador sobre pos_sales y pos_sale_items usaban
-- TO public en lugar de TO authenticated, igual que el resto de políticas admin
-- del proyecto (brands, categories, products, orders, etc.).
--
-- La misma inconsistencia (TO public en políticas que deberían ser authenticated)
-- sigue pendiente SIN corregir en:
--   - order_items_own_insert
--   - order_items_own_select
-- Esto es por decisión explícita del dueño del proyecto. Esas políticas no
-- forman parte del alcance de esta migración.
--
-- Verificar antes de ejecutar que las políticas existen con el nombre exacto:
--   SELECT policyname, roles FROM pg_policies
--   WHERE tablename IN ('pos_sales', 'pos_sale_items');
-- =============================================================================

-- ----------------------------------------------------------------------------
-- pos_sales
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pos_sales_admin_all" ON public.pos_sales;

CREATE POLICY "pos_sales_admin_all"
  ON public.pos_sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))
    )
  );

-- ----------------------------------------------------------------------------
-- pos_sale_items
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pos_sale_items_admin_all" ON public.pos_sale_items;

CREATE POLICY "pos_sale_items_admin_all"
  ON public.pos_sale_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))
    )
  );
