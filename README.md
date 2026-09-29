# Control de Pagos - Gimnasio

Sistema web para control de pagos semanales a coaches de gimnasio.

## Descripción

Aplicación que permite gestionar horarios de coaches por gimnasio (A/B), calcular pagos semanales automáticamente, aplicar descuentos y generar reportes en PDF.

## Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **PDF**: jsPDF + jspdf-autotable

## Estructura del Proyecto

```
src/
├── app/
│   ├── config/page.tsx      # Configuración de coaches y franjas horarias
│   ├── descuentos/page.tsx  # Gestión de descuentos por coach
│   ├── horario/page.tsx     # Grid de horarios semanal (drag & drop)
│   ├── pagos/page.tsx       # Resumen de pagos y generación de PDF
│   ├── layout.tsx           # Layout principal con navegación
│   └── page.tsx             # Dashboard
├── lib/
│   ├── calculations.ts      # Lógica de cálculo de pagos
│   ├── pdf.ts               # Generación de PDFs
│   ├── store.tsx            # Estado global con Context API
│   ├── supabase.ts          # Cliente de Supabase
│   └── types.ts             # Tipos TypeScript
└── supabase/
    ├── schema.sql           # Schema de la base de datos
    └── migrations/          # Migraciones SQL
```

## Funcionalidades

### Gestión de Coaches
- Agregar/editar/eliminar coaches
- Configurar tarifa por hora o tarifa fija
- Asignar colores para identificación visual

### Gestión de Franjas Horarias
- Crear franjas horarias personalizadas
- Diferentes franjas por gimnasio (A/B)

### Horario Semanal
- Grid interactivo de 7 días × N franjas
- Drag & drop para asignar coaches
- Tarifa variable por celda (override)
- Separación completa entre Gimnasio A y B

### Pagos
- Cálculo automático de pagos semanales
- Desglose por coach con detalle de tarifas
- Aplicación de descuentos
- Generación de PDF general e individuales

### Cierre de Semana
- Botón para cerrar semana y avanzar a la siguiente
- Los datos se guardan en Supabase

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## Deploy

El proyecto está desplegado en Vercel:
- **URL**: https://output-sooty-delta.vercel.app

Para hacer deploy:
```bash
npx vercel --prod
```

## Base de Datos

El schema de Supabase incluye:
- `coaches` - Información de coaches
- `franjas` - Franjas horarias
- `horarios` - Asignaciones de horarios (con columna `gym` para separar A/B)
- `descuentos` - Descuentos aplicados a coaches

Ver `src/supabase/schema.sql` para el schema completo.

## Estado Actual

**Versión**: 2.0 (con separación de gyms y desglose de pagos)

### Funcionalidades Implementadas
- ✅ Separación completa de coaches y franjas por gimnasio
- ✅ Tarifa variable por celda (override)
- ✅ Desglose detallado de pagos por coach
- ✅ Drag & drop en horario
- ✅ Generación de PDFs
- ✅ Cierre de semana automático

### Próximas Mejoras
- [ ] Autenticación multi-usuario
- [ ] Historial de semanas anteriores
- [ ] Exportar a Excel
- [ ] Notificaciones automáticas

## Licencia

Privado - Uso interno
