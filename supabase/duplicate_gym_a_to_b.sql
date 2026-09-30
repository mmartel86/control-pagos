-- =============================================
-- Script para duplicar datos de Gimnasio A a B
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Duplicar coaches de A a B
INSERT INTO coaches (id, nombre, tipo_tarifa, tarifa, color, gym, activo)
SELECT 
  'B_' || id,
  nombre,
  tipo_tarifa,
  tarifa,
  color,
  'B',
  activo
FROM coaches
WHERE gym = 'A';

-- 2. Duplicar franjas de A a B
INSERT INTO franjas (id, hora_inicio, hora_fin, gym)
SELECT 
  'B_' || id,
  hora_inicio,
  hora_fin,
  'B'
FROM franjas
WHERE gym = 'A';

-- 3. Verificar resultados
SELECT 'Coaches A' as tabla, COUNT(*) as total FROM coaches WHERE gym = 'A'
UNION ALL
SELECT 'Coaches B', COUNT(*) FROM coaches WHERE gym = 'B'
UNION ALL
SELECT 'Franjas A', COUNT(*) FROM franjas WHERE gym = 'A'
UNION ALL
SELECT 'Franjas B', COUNT(*) FROM franjas WHERE gym = 'B';

-- =============================================
-- Después de ejecutar:
-- - Gimnasio A mantiene sus datos originales
-- - Gimnasio B tiene copias de los mismos coaches y franjas
-- - Puedes editar los datos de B independientemente
-- =============================================
