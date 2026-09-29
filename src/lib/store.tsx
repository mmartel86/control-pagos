"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSupabase } from "./supabase";
import {
  Coach,
  TimeSlot,
  WeekSchedule,
  Discount,
  PaymentSummary,
  DIAS,
} from "./types";

interface AppData {
  coaches: Coach[];
  timeSlots: TimeSlot[];
  schedules: Record<string, WeekSchedule>;
  discounts: Discount[];
  semanaActual: string;
  lugarActual: string;
  loading: boolean;
}

const defaultData: AppData = {
  coaches: [],
  timeSlots: [],
  schedules: {},
  discounts: [],
  semanaActual: "2026-W39",
  lugarActual: "Gimnasio A",
  loading: true,
};

interface AppContextType extends AppData {
  addCoach: (coach: Omit<Coach, "id">) => Promise<void>;
  updateCoach: (id: string, coach: Partial<Coach>) => Promise<void>;
  removeCoach: (id: string) => Promise<void>;
  addTimeSlot: (slot: Omit<TimeSlot, "id">) => Promise<void>;
  removeTimeSlot: (id: string) => Promise<void>;
  setScheduleCell: (
    semanaId: string,
    dia: string,
    slotId: string,
    coachId: string | null,
    tarifaOverride?: number | null
  ) => Promise<void>;
  addDiscount: (discount: Omit<Discount, "id">) => Promise<void>;
  removeDiscount: (id: string) => Promise<void>;
  setSemanaActual: (s: string) => void;
  setLugarActual: (l: string) => void;
  closeWeek: () => void;
  calculatePayments: (semanaId: string) => PaymentSummary[];
  getScheduleKey: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    const [coachesRes, franjasRes, horariosRes, descuentosRes] = await Promise.all([
      getSupabase().from("coaches").select("*").order("nombre"),
      getSupabase().from("franjas").select("*").order("hora_inicio"),
      getSupabase().from("horarios").select("*"),
      getSupabase().from("descuentos").select("*"),
    ]);

    if (coachesRes.error) console.error("Error loading coaches:", coachesRes.error.message);
    if (franjasRes.error) console.error("Error loading franjas:", franjasRes.error.message);
    if (horariosRes.error) console.error("Error loading horarios:", horariosRes.error.message);
    if (descuentosRes.error) console.error("Error loading descuentos:", descuentosRes.error.message);

    const coaches: Coach[] = (coachesRes.data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      tipoTarifa: c.tipo_tarifa,
      tarifa: Number(c.tarifa),
      color: c.color,
    }));

    const timeSlots: TimeSlot[] = (franjasRes.data || []).map((f: any) => ({
      id: f.id,
      horaInicio: f.hora_inicio,
      horaFin: f.hora_fin,
    }));

    const discounts: Discount[] = (descuentosRes.data || []).map((d: any) => ({
      id: d.id,
      coachId: d.coach_id,
      semanaId: d.semana_id,
      concepto: d.concepto,
      monto: Number(d.monto),
    }));

    // Build schedules from horarios
    const schedules: Record<string, WeekSchedule> = {};
    for (const h of horariosRes.data || []) {
      const key = `${h.semana_id}_${h.lugar}`;
      if (!schedules[key]) {
        schedules[key] = { semanaId: h.semana_id, lugar: h.lugar, horarios: {} };
      }
      if (!schedules[key].horarios[h.dia]) {
        schedules[key].horarios[h.dia] = {};
      }
      schedules[key].horarios[h.dia][h.franja_id] = {
        coachId: h.coach_id,
        tarifaOverride: h.tarifa_override != null ? Number(h.tarifa_override) : null,
      };
    }

    setData((prev) => ({
      ...prev,
      coaches,
      timeSlots,
      schedules,
      discounts,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // COACHES
  const addCoach = async (coach: Omit<Coach, "id">) => {
    const id = Date.now().toString();
    await getSupabase().from("coaches").insert({
      id,
      nombre: coach.nombre,
      tipo_tarifa: coach.tipoTarifa,
      tarifa: coach.tarifa,
      color: coach.color,
    });
    setData((prev) => ({
      ...prev,
      coaches: [...prev.coaches, { ...coach, id }],
    }));
  };

  const updateCoach = async (id: string, coach: Partial<Coach>) => {
    const update: any = {};
    if (coach.nombre) update.nombre = coach.nombre;
    if (coach.tipoTarifa) update.tipo_tarifa = coach.tipoTarifa;
    if (coach.tarifa !== undefined) update.tarifa = coach.tarifa;
    if (coach.color) update.color = coach.color;
    await getSupabase().from("coaches").update(update).eq("id", id);
    setData((prev) => ({
      ...prev,
      coaches: prev.coaches.map((c) => (c.id === id ? { ...c, ...coach } : c)),
    }));
  };

  const removeCoach = async (id: string) => {
    const { error } = await getSupabase().from("coaches").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando coach:", error.message);
      alert(`No se pudo eliminar el coach: ${error.message}`);
      return;
    }
    setData((prev) => ({
      ...prev,
      coaches: prev.coaches.filter((c) => c.id !== id),
    }));
  };

  // TIME SLOTS
  const addTimeSlot = async (slot: Omit<TimeSlot, "id">) => {
    const id = Date.now().toString();
    await getSupabase().from("franjas").insert({
      id,
      hora_inicio: slot.horaInicio,
      hora_fin: slot.horaFin,
    });
    setData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { ...slot, id }],
    }));
  };

  const removeTimeSlot = async (id: string) => {
    const { error } = await getSupabase().from("franjas").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando franja:", error.message);
      alert(`No se pudo eliminar la franja: ${error.message}`);
      return;
    }
    setData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((t) => t.id !== id),
    }));
  };

  // SCHEDULE CELLS
  const setScheduleCell = async (
    semanaId: string,
    dia: string,
    slotId: string,
    coachId: string | null,
    tarifaOverride?: number | null
  ) => {
    const lugar = data.lugarActual;

    // Delete existing cell
    await getSupabase()
      .from("horarios")
      .delete()
      .eq("semana_id", semanaId)
      .eq("lugar", lugar)
      .eq("dia", dia)
      .eq("franja_id", slotId);

    // Insert new cell if coach assigned
    if (coachId) {
      const insertData: any = {
        id: `${semanaId}_${lugar}_${dia}_${slotId}`,
        semana_id: semanaId,
        lugar,
        dia,
        franja_id: slotId,
        coach_id: coachId,
      };
      if (tarifaOverride != null) {
        insertData.tarifa_override = tarifaOverride;
      }
      await getSupabase().from("horarios").insert(insertData);
    }

    // Update local state
    setData((prev) => {
      const key = `${semanaId}_${prev.lugarActual}`;
      const existing = prev.schedules[key];
      const horarios = existing ? { ...existing.horarios } : {};
      if (!horarios[dia]) horarios[dia] = {};
      horarios[dia] = { ...horarios[dia], [slotId]: { coachId, tarifaOverride: tarifaOverride ?? null } };
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [key]: { semanaId, lugar: prev.lugarActual, horarios },
        },
      };
    });
  };

  // DISCOUNTS
  const addDiscount = async (discount: Omit<Discount, "id">) => {
    const id = Date.now().toString();
    await getSupabase().from("descuentos").insert({
      id,
      semana_id: discount.semanaId,
      coach_id: discount.coachId,
      concepto: discount.concepto,
      monto: discount.monto,
    });
    setData((prev) => ({
      ...prev,
      discounts: [...prev.discounts, { ...discount, id }],
    }));
  };

  const removeDiscount = async (id: string) => {
    await getSupabase().from("descuentos").delete().eq("id", id);
    setData((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((d) => d.id !== id),
    }));
  };

  // LOCAL ONLY (no DB needed)
  const getScheduleKey = () => `${data.semanaActual}_${data.lugarActual}`;

  const calculatePayments = (semanaId: string): PaymentSummary[] => {
    const key = `${semanaId}_${data.lugarActual}`;
    const schedule = data.schedules[key];
    if (!schedule) return [];

    const coachClassCount: Record<string, number> = {};
    const coachEarnings: Record<string, number> = {};
    for (const dia of DIAS) {
      const daySlots = schedule.horarios[dia];
      if (!daySlots) continue;
      for (const slotId of Object.keys(daySlots)) {
        const cell = daySlots[slotId];
        if (cell.coachId && cell.coachId !== "TRAINING") {
          coachClassCount[cell.coachId] = (coachClassCount[cell.coachId] || 0) + 1;
          const coach = data.coaches.find((c) => c.id === cell.coachId);
          if (coach) {
            const tarifa = cell.tarifaOverride ?? coach.tarifa;
            coachEarnings[cell.coachId] = (coachEarnings[cell.coachId] || 0) + tarifa;
          }
        }
      }
    }

    return data.coaches
      .filter((c) => coachClassCount[c.id])
      .map((coach) => {
        const clases = coachClassCount[coach.id];
        const subtotal = coachEarnings[coach.id] || 0;
        const tarifaPromedio = clases > 0 ? Math.round(subtotal / clases) : coach.tarifa;
        const coachDiscounts = data.discounts.filter(
          (d) => d.coachId === coach.id && d.semanaId === semanaId
        );
        const descuentos = coachDiscounts.reduce((sum, d) => sum + d.monto, 0);
        return {
          coachId: coach.id,
          coachNombre: coach.nombre,
          clases,
          tarifaPorClase: tarifaPromedio,
          subtotal,
          descuentos,
          total: subtotal - descuentos,
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  const closeWeek = () => {
    // Parse current week: "2026-W39" -> year=2026, week=39
    const match = data.semanaActual.match(/^(\d{4})-W(\d+)$/);
    if (!match) return;
    
    const year = parseInt(match[1]);
    const week = parseInt(match[2]);
    
    // Calculate next week
    let nextWeek = week + 1;
    let nextYear = year;
    
    // Handle year rollover (52 or 53 weeks)
    if (nextWeek > 52) {
      nextWeek = 1;
      nextYear = year + 1;
    }
    
    const nextWeekStr = `${nextYear}-W${nextWeek.toString().padStart(2, '0')}`;
    setData((prev) => ({ ...prev, semanaActual: nextWeekStr }));
  };

  return (
    <AppContext.Provider
      value={{
        ...data,
        addCoach,
        updateCoach,
        removeCoach,
        addTimeSlot,
        removeTimeSlot,
        setScheduleCell,
        addDiscount,
        removeDiscount,
        setSemanaActual: (s) => setData((p) => ({ ...p, semanaActual: s })),
        setLugarActual: (l) => setData((p) => ({ ...p, lugarActual: l })),
        closeWeek,
        calculatePayments,
        getScheduleKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
