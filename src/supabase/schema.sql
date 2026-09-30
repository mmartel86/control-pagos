-- =============================================
-- Schema: Control de Pagos - Gimnasio
-- =============================================

-- Tabla de coaches
CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_tarifa TEXT NOT NULL CHECK (tipo_tarifa IN ('hora', 'fija')),
  tarifa NUMERIC NOT NULL DEFAULT 30,
  color TEXT NOT NULL DEFAULT '#6B7280',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de franjas horarias
CREATE TABLE IF NOT EXISTS franjas (
  id TEXT PRIMARY KEY,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de horarios (cada celda del grid)
CREATE TABLE IF NOT EXISTS horarios (
  id TEXT PRIMARY KEY,
  semana_id TEXT NOT NULL,
  lugar TEXT NOT NULL DEFAULT 'Gimnasio A',
  dia TEXT NOT NULL CHECK (dia IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')),
  franja_id TEXT NOT NULL REFERENCES franjas(id),
  coach_id TEXT REFERENCES coaches(id),
  tarifa_override NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de descuentos
CREATE TABLE IF NOT EXISTS descuentos (
  id TEXT PRIMARY KEY,
  semana_id TEXT NOT NULL,
  coach_id TEXT NOT NULL REFERENCES coaches(id),
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_horarios_semana ON horarios(semana_id, lugar);
CREATE INDEX IF NOT EXISTS idx_descuentos_semana ON descuentos(semana_id, coach_id);

-- =============================================
-- Datos iniciales
-- =============================================

-- Coaches
INSERT INTO coaches (id, nombre, tipo_tarifa, tarifa, color) VALUES
  ('1', 'MUCIA', 'hora', 40, '#8B5CF6'),
  ('2', 'ETHAN', 'hora', 30, '#EC4899'),
  ('3', 'ROBERTO', 'hora', 30, '#10B981'),
  ('4', 'AYLEEN', 'hora', 30, '#84CC16'),
  ('5', 'VICTOR', 'fija', 50, '#3B82F6'),
  ('6', 'KIARA', 'hora', 30, '#8B5CF6'),
  ('7', 'CARMEN', 'hora', 30, '#6B7280'),
  ('8', 'GIANA', 'hora', 30, '#EF4444')
ON CONFLICT (id) DO NOTHING;

-- Franjas horarias
INSERT INTO franjas (id, hora_inicio, hora_fin) VALUES
  ('ts1', '06:10', '07:00'),
  ('ts2', '07:10', '08:00'),
  ('ts3', '08:10', '09:00'),
  ('ts4', '09:10', '10:00'),
  ('ts5', '10:15', '11:05'),
  ('ts6', '17:00', '17:50'),
  ('ts7', '18:10', '19:00'),
  ('ts8', '19:20', '20:10'),
  ('ts9', '20:25', '21:15')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Row Level Security (RLS)
-- Permitir lectura/escrita sin auth (single user)
-- =============================================
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE franjas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;

-- Policies: permitir todo (single user, sin auth)
CREATE POLICY "Allow all on coaches" ON coaches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on franjas" ON franjas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on horarios" ON horarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on descuentos" ON descuentos FOR ALL USING (true) WITH CHECK (true);
