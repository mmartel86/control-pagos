-- =============================================
-- Migracion 002: Separacion de gimnasios
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna gym a las tablas
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS gym TEXT DEFAULT 'A';
ALTER TABLE franjas ADD COLUMN IF NOT EXISTS gym TEXT DEFAULT 'A';
ALTER TABLE descuentos ADD COLUMN IF NOT EXISTS gym TEXT DEFAULT 'A';

-- 2. Actualizar datos existentes
-- Asignar todos los datos actuales al Gimnasio A por defecto
-- (El cliente puede reorganizar después desde la UI)

UPDATE coaches SET gym = 'A' WHERE gym IS NULL;
UPDATE franjas SET gym = 'A' WHERE gym IS NULL;
UPDATE descuentos SET gym = 'A' WHERE gym IS NULL;

-- 3. Agregar índices para mejorar rendimiento de consultas filtradas por gym
CREATE INDEX IF NOT EXISTS idx_coaches_gym ON coaches(gym);
CREATE INDEX IF NOT EXISTS idx_franjas_gym ON franjas(gym);
CREATE INDEX IF NOT EXISTS idx_descuentos_gym ON descuentos(gym);
CREATE INDEX IF NOT EXISTS idx_horarios_gym ON horarios(lugar);

-- =============================================
-- Notas:
-- - Los datos existentes se asignan al Gimnasio A
-- - El cliente debe crear manualmente los datos del Gimnasio B
-- - O usar la UI para cambiar el gimnasio y agregar nuevos datos
-- =============================================
