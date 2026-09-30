-- =============================================
-- Migracion 003: Fix descuentos existentes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Asignar descuentos existentes al gimnasio donde el coach tiene más clases
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

-- Verificar que todos los descuentos tengan gym asignado
SELECT COUNT(*) as descuentos_sin_gym FROM descuentos WHERE gym IS NULL;

-- =============================================
-- Notas:
-- - Los descuentos ahora están asignados a un gimnasio específico
-- - Los cálculos solo mostrarán descuentos del gimnasio actual
-- =============================================
