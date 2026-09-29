import { Coach, DIAS, WeekSchedule, Discount, ClassBreakdown } from "./types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function calculatePayments(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugarActual: string
) {
  const key = `${semanaId}_${lugarActual}`;
  const schedule = schedules[key];

  const clasesPorCoach: Record<string, number> = {};
  const earningsPorCoach: Record<string, number> = {};

  if (schedule) {
    for (const dia of DIAS) {
      const daySlots = schedule.horarios[dia];
      if (!daySlots) continue;
      for (const slotId of Object.keys(daySlots)) {
        const cell = daySlots[slotId];
        if (cell.coachId && cell.coachId !== "TRAINING") {
          clasesPorCoach[cell.coachId] =
            (clasesPorCoach[cell.coachId] || 0) + 1;
          const coach = coaches.find((c) => c.id === cell.coachId);
          if (coach) {
            const tarifa = cell.tarifaOverride ?? coach.tarifa;
            earningsPorCoach[cell.coachId] =
              (earningsPorCoach[cell.coachId] || 0) + tarifa;
          }
        }
      }
    }
  }

  return coaches
    .filter((c) => clasesPorCoach[c.id])
    .map((coach) => {
      const clases = clasesPorCoach[coach.id];
      const subtotal = earningsPorCoach[coach.id] || clases * coach.tarifa;
      const tarifaPromedio = clases > 0 ? Math.round(subtotal / clases) : coach.tarifa;

      // Generar desglose por tarifa
      const breakdownMap = new Map<number, { count: number; subtotal: number }>();
      if (schedule) {
        for (const dia of DIAS) {
          const daySlots = schedule.horarios[dia];
          if (!daySlots) continue;
          for (const slotId of Object.keys(daySlots)) {
            const cell = daySlots[slotId];
            if (cell.coachId === coach.id) {
              const rate = cell.tarifaOverride ?? coach.tarifa;
              const existing = breakdownMap.get(rate) || { count: 0, subtotal: 0 };
              breakdownMap.set(rate, {
                count: existing.count + 1,
                subtotal: existing.subtotal + rate,
              });
            }
          }
        }
      }
      const breakdown: ClassBreakdown[] = Array.from(breakdownMap.entries())
        .map(([rate, { count, subtotal: sub }]) => ({ rate, count, subtotal: sub }))
        .sort((a, b) => b.rate - a.rate);

      const coachDescuentos = discounts.filter(
        (d) => d.coachId === coach.id && d.semanaId === semanaId
      );
      const descuentos = coachDescuentos.reduce((sum, d) => sum + d.monto, 0);
      return {
        coachId: coach.id,
        coachNombre: coach.nombre,
        clases,
        tarifaPorClase: tarifaPromedio,
        subtotal,
        descuentos,
        total: subtotal - descuentos,
        breakdown,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function generateGeneralPDF(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugarActual: string
) {
  const data = calculatePayments(coaches, schedules, discounts, semanaId, lugarActual);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Pagos Semanales", 14, 22);
  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId} | Lugar: ${lugarActual}`, 14, 32);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, 40);

  const totalGeneral = data.reduce((sum, s) => sum + s.total, 0);

  autoTable(doc, {
    startY: 50,
    head: [
      ["Coach", "Desglose de Clases", "Subtotal", "Descuento", "Total"],
    ],
    body: data.map((s) => {
      const desglose = s.breakdown
        .map((b) => `${b.count}x $${b.rate}`)
        .join(", ");
      return [
        s.coachNombre,
        desglose || `${s.clases} clases`,
        `$${s.subtotal}`,
        `$${s.descuentos}`,
        `$${s.total}`,
      ];
    }),
    foot: [["", "", "", "TOTAL:", `$${totalGeneral}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-pagos-${semanaId}.pdf`);
}

export function generateIndividualPDF(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugarActual: string,
  coachId: string
) {
  const coach = coaches.find((c) => c.id === coachId);
  if (!coach) return;

  const data = calculatePayments(
    coaches.filter((c) => c.id === coachId),
    schedules,
    discounts,
    semanaId,
    lugarActual
  );
  const summary = data[0];
  if (!summary) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Recibo de Pago", 14, 22);
  doc.setFontSize(14);
  doc.text(coach.nombre, 14, 36);
  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId} | Lugar: ${lugarActual}`, 14, 46);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, 54);

  // Construir filas de desglose
  const breakdownRows = summary.breakdown.map((b) => [
    `${b.count} clase${b.count > 1 ? "s" : ""} a $${b.rate}`,
    "",
    `$${b.subtotal}`,
  ]);

  autoTable(doc, {
    startY: 64,
    head: [["Concepto", "Detalle", "Monto"]],
    body: [
      ...breakdownRows,
      ["", "Subtotal", `$${summary.subtotal}`],
      ["Descuentos", summary.descuentos > 0 ? `${summary.descuentos} en descuentos` : "Sin descuentos", `-$${summary.descuentos}`],
    ],
    foot: [["", "TOTAL A PAGAR", `$${summary.total}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`recibo-${coach.nombre.toLowerCase()}-${semanaId}.pdf`);
}
