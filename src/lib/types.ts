export interface Coach {
  id: string;
  nombre: string;
  tipoTarifa: "hora" | "fija";
  tarifa: number;
  color: string;
}

export interface TimeSlot {
  id: string;
  horaInicio: string;
  horaFin: string;
}

export interface ScheduleCell {
  coachId: string | null;
  tarifaOverride?: number | null;
}

export interface WeekSchedule {
  semanaId: string;
  lugar: string;
  horarios: Record<string, Record<string, ScheduleCell>>;
}

export interface Discount {
  id: string;
  coachId: string;
  semanaId: string;
  concepto: string;
  monto: number;
}

export interface ClassBreakdown {
  rate: number;
  count: number;
  subtotal: number;
}

export interface PaymentSummary {
  coachId: string;
  coachNombre: string;
  clases: number;
  tarifaPorClase: number;
  subtotal: number;
  descuentos: number;
  total: number;
  breakdown: ClassBreakdown[];
}

export const DIAS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export const LUGARES = ["Gimnasio A", "Gimnasio B"];

export const COACH_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
];
