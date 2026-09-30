-- =============================================
-- Script para asignar gym a descuentos existentes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Ver descuentos sin gym
SELECT id, coach_id, semana_id, concepto, monto, gym 
FROM descuentos 
WHERE gym IS NULL;

-- Asignar gym basado en donde el coach tiene más clases esa semana
UPDATE descuentos d
SET gym = COALESCE(
  (
    SELECT h.lugar 
    FROM horarios h 
    WHERE h.coach_id = d.coach_id 
    AND h.semana_id = d.semana_id
    LIMIT 1
  ),
  'A'  -- Default a Gimnasio A si no hay horarios
)
WHERE d.gym IS NULL;

-- Verificar que todos los descuentos tengan gym
SELECT COUNT(*) as total_descuentos,
       COUNT(gym) as con_gym,
       COUNT(*) - COUNT(gym) as sin_gym
FROM descuentos;

-- =============================================
-- Si aún hay descuentos sin gym, asignar manualmente:
-- =============================================
-- UPDATE descuentos SET gym = 'A' WHERE gym IS NULL;
-- O
-- UPDATE descuentos SET gym = 'B' WHERE gym IS NULL;
