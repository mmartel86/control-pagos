-- =============================================
-- Script para borrar todos los descuentos existentes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Ver cuántos descuentos hay antes de borrar
SELECT COUNT(*) as total_descuentos FROM descuentos;

-- Borrar todos los descuentos
DELETE FROM descuentos;

-- Verificar que se borraron
SELECT COUNT(*) as total_descuentos FROM descuentos;

-- =============================================
-- Después de ejecutar esto:
-- 1. Los descuentos existentes se borran
-- 2. Ve a la app y crea los descuentos de nuevo
-- 3. Ahora sí se guardarán con el gym correcto
-- =============================================
