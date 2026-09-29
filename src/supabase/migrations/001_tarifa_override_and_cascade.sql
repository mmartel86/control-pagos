-- =============================================
-- Migracion 001: Tarifa override + Fix deletes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna tarifa_override a horarios
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS tarifa_override NUMERIC;

-- 2. Fix: permitir borrar franjas aunque tengan horarios asociados
--    (antes fallaba silenciosamente por la FK)
ALTER TABLE horarios DROP CONSTRAINT IF EXISTS horarios_franja_id_fkey;
ALTER TABLE horarios
  ADD CONSTRAINT horarios_franja_id_fkey
  FOREIGN KEY (franja_id) REFERENCES franjas(id)
  ON DELETE CASCADE;

-- 3. Fix: permitir borrar coaches aunque tengan horarios/descuentos
ALTER TABLE horarios DROP CONSTRAINT IF EXISTS horarios_coach_id_fkey;
ALTER TABLE horarios
  ADD CONSTRAINT horarios_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES coaches(id)
  ON DELETE SET NULL;

ALTER TABLE descuentos DROP CONSTRAINT IF EXISTS descuentos_coach_id_fkey;
ALTER TABLE descuentos
  ADD CONSTRAINT descuentos_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES coaches(id)
  ON DELETE CASCADE;
