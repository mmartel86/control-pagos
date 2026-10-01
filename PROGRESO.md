# Control de Pagos — Progreso

**Última actualización:** 30 Sep 2026
**Estado:** En desarrollo activo
**URL:** https://output-sooty-delta.vercel.app
**Repo:** https://github.com/mmartel86/control-pagos

---

## Descripción

App de control de pagos para un cliente que opera dos gimnasios (Gimnasio A y Gimnasio B). Gestiona coaches, horarios semanales, descuentos y genera reportes de pago.

## Stack

- **Frontend:** Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Deploy:** Vercel (auto-deploy via GitHub)
- **PDF:** jsPDF + jspdf-autotable

## Credenciales

- **Supabase URL:** `https://htitvlnhnuesrhgcqzla.supabase.co`
- **Supabase project:** `htitvlnhnuesrhgcqzla`
- **Anon key:** en variables de entorno de Vercel
- **GitHub repo:** `mmartel86/control-pagos` (pública)
- **Vercel project:** `control-pagos`

## Estructura del proyecto

```
output/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard (gym actual)
│   │   ├── horario/page.tsx      # Calendario semanal
│   │   ├── config/page.tsx       # Config coaches y franjas
│   │   ├── descuentos/page.tsx   # Gestión de descuentos
│   │   ├── pagos/page.tsx        # Vista consolidada de pagos
│   │   └── layout.tsx            # Layout con sidebar y selector de gym
│   ├── components/
│   │   ├── CoachPreview.tsx      # Modal detalle por coach
│   │   ├── ConsolidatedPreview.tsx
│   │   └── GymBanner.tsx
│   └── lib/
│       ├── store.tsx             # Estado global (React Context)
│       ├── calculations.ts       # Cálculos y generación de PDFs
│       ├── supabase.ts           # Cliente Supabase
│       └── types.ts              # Tipos TypeScript
├── supabase/
│   ├── schema.sql                # Esquema base
│   └── migrations/               # Migraciones SQL
└── PROYECTO.md                   # Documentación completa
```

## Tablas de Supabase

| Tabla | Campos principales |
|-------|-------------------|
| `coaches` | id, nombre, tipo_tarifa, tarifa, color, gym |
| `franjas` | id, hora_inicio, hora_fin, gym |
| `horarios` | id, semana_id, lugar, dia, franja_id, coach_id, tarifa_override |
| `descuentos` | id, semana_id, coach_id, concepto, monto, gym |

**Nota:** `gym` usa códigos cortos "A" / "B" en Supabase. El UI muestra "Gimnasio A" / "Gimnasio B".

## Lógica de descuentos

- Se guardan con `gym` para no duplicar entre gimnasios
- Se aplican como **última operación de resta** (no dentro del subtotal de cada gym)
- Vista consolidada: subtotales por gym (sin descuentos) → descuentos → total

## Funcionalidades implementadas

- [x] Separación por gimnasios (coaches, franjas, horarios, descuentos)
- [x] Horario semanal con drag & drop
- [x] Tarifa override por celda de horario
- [x] Dashboard con resumen por coach (A Pagar con descuento)
- [x] Vista consolidada de pagos (ambos gym)
- [x] Descuentos separados por gym
- [x] Botón "Limpiar Horario" (borra horarios y descuentos del gym)
- [x] PDFs: consolidado, por gym, individual por coach
- [x] Selector de gym oculto en sección Pagos
- [x] Auto-deploy via GitHub → Vercel

## Pendiente / Ideas futuras

- [ ] Importación desde Excel (botón "Subir Excel" es placeholder)
- [ ] Historial de semanas cerradas
- [ ] Exportar datos a CSV
- [ ] Autenticación de usuarios
- [ ] Notificaciones de pago

## Comandos útiles

```bash
# Desarrollo local
npm run dev

# Deploy manual (fallback)
npx vercel --prod --yes

# Deploy via Git (automático)
git add .
git commit -m "descripcion"
git push
```

## Notas para el desarrollador

1. **`loadData` carga TODO sin filtro de gym** — cada componente filtra lo que necesita
2. **`calculatePayments`** (store): filtra por gym actual, usado por Dashboard
3. **`calculateConsolidatedPayments`** (store): itera ambos gym, usado por Pagos
4. **`calculations.ts`**: funciones de PDF, filtran descuentos por gym
5. **Horarios** se almacenan con `lugar` (nombre completo "Gimnasio A"), no con código
6. **Los descuentos** se filtran por `gym` ("A"/"B") + `semanaId` + `coachId`
7. **Vercel Hobby**: repos deben ser públicas para auto-deploy
