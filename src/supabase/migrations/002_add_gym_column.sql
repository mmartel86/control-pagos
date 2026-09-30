-- =============================================
-- Migracion 002: Agregar columna gym a tablas
-- Separar coaches, franjas y descuentos por gimnasio
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna gym a coaches
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS gym TEXT NOT NULL DEFAULT 'A';

-- 2. Agregar columna gym a franjas
ALTER TABLE franjas ADD COLUMN IF NOT EXISTS gym TEXT NOT NULL DEFAULT 'A';

-- 3. Agregar columna gym a descuentos
ALTER TABLE descuentos ADD COLUMN IF NOT EXISTS gym TEXT NOT NULL DEFAULT 'A';

-- 4. Migrar datos existentes (asumir Gym A)
UPDATE coaches SET gym = 'A' WHERE gym IS NULL;
UPDATE franjas SET gym = 'A' WHERE gym IS NULL;
UPDATE descuentos SET gym = 'A' WHERE gym IS NULL;

-- 5. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_coaches_gym ON coaches(gym);
CREATE INDEX IF NOT EXISTS idx_franjas_gym ON franjas(gym);
CREATE INDEX IF NOT EXISTS idx_descuentos_gym ON descuentos(gym);

-- 6. Actualizar políticas RLS para incluir filtro de gym
DROP POLICY IF EXISTS "Allow all on coaches" ON coaches;
DROP POLICY IF EXISTS "Allow all on franjas" ON franjas;
DROP POLICY IF EXISTS "Allow all on descuentos" ON descuentos;

CREATE POLICY "Allow all on coaches" ON coaches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on franjas" ON franjas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on descuentos" ON descuentos FOR ALL USING (true) WITH CHECK (true);
