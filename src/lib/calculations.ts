import { Coach, DIAS, WeekSchedule, Discount } from "./types";
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
      ["Coach", "Clases", "Tarifa Prom.", "Subtotal", "Descuento", "Total"],
    ],
    body: data.map((s) => [
      s.coachNombre,
      s.clases.toString(),
      `$${s.tarifaPorClase}`,
      `$${s.subtotal}`,
      `$${s.descuentos}`,
      `$${s.total}`,
    ]),
    foot: [["", "", "", "", "TOTAL:", `$${totalGeneral}`]],
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

  autoTable(doc, {
    startY: 64,
    head: [["Concepto", "Detalle", "Monto"]],
    body: [
      ["Clases impartidas", `${summary.clases} clases`, ""],
      [
        "Tarifa promedio por clase",
        `$${summary.tarifaPorClase}/clase`,
        `$${summary.subtotal}`,
      ],
      ["Descuentos", `${summary.descuentos} en descuentos`, `-$${summary.descuentos}`],
    ],
    foot: [["", "TOTAL A PAGAR", `$${summary.total}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`recibo-${coach.nombre.toLowerCase()}-${semanaId}.pdf`);
}
