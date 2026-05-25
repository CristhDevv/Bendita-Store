-- ============================================================
-- Bendita Store — Analytics Events Migration
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enum para tipos de evento
CREATE TYPE analytics_event_type AS ENUM (
  'page_view',
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'search',
  'wishlist_add',
  'wishlist_remove'
);

-- 2. Tabla principal
CREATE TABLE analytics_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text        NOT NULL,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  event_type  analytics_event_type NOT NULL,
  page        text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices de rendimiento
CREATE INDEX idx_analytics_events_created_at   ON analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_event_type   ON analytics_events (event_type);
CREATE INDEX idx_analytics_events_session_id   ON analytics_events (session_id);
CREATE INDEX idx_analytics_events_user_id      ON analytics_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_payload_gin  ON analytics_events USING gin (payload);

-- 4. Seguridad por filas (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede registrar eventos (anónimo o logueado)
CREATE POLICY "analytics_events_insert_public"
  ON analytics_events FOR INSERT TO public
  WITH CHECK (true);

-- Solo admins pueden leer los datos
CREATE POLICY "analytics_events_select_admins_only"
  ON analytics_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Solo admins pueden eliminar eventos
CREATE POLICY "analytics_events_delete_admins_only"
  ON analytics_events FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
