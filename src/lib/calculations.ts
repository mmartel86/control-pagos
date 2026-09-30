import { Coach, DIAS, WeekSchedule, Discount, GymPaymentSummary } from "./types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function getGymCode(lugar: string): string {
  return lugar === "Gimnasio A" ? "A" : "B";
}

export function calculatePayments(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugarActual: string
): GymPaymentSummary {
  const gymCode = getGymCode(lugarActual);
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

  const payments = coaches
    .filter((c) => clasesPorCoach[c.id])
    .map((coach) => {
      const clases = clasesPorCoach[coach.id];
      const subtotal = earningsPorCoach[coach.id] || clases * coach.tarifa;
      const tarifaPromedio = clases > 0 ? Math.round(subtotal / clases) : coach.tarifa;
      // Filtrar descuentos por gym Y coach
      const coachDescuentos = discounts.filter(
        (d) => d.coachId === coach.id && d.semanaId === semanaId && d.gym === gymCode
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
        gym: lugarActual,
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalGeneral = payments.reduce((sum, p) => sum + p.total, 0);
  const totalDescuentos = payments.reduce((sum, p) => sum + p.descuentos, 0);

  return {
    gym: lugarActual,
    payments,
    totalGeneral,
    totalDescuentos,
  };
}

export function generateGeneralPDF(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugarActual: string
) {
  const { payments, totalGeneral } = calculatePayments(coaches, schedules, discounts, semanaId, lugarActual);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Pagos Semanales", 14, 22);
  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId} | Lugar: ${lugarActual}`, 14, 32);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, 40);

  autoTable(doc, {
    startY: 50,
    head: [
      ["Coach", "Clases", "Subtotal", "Descuento", "A Pagar"],
    ],
    body: payments.map((s) => [
      s.coachNombre,
      s.clases.toString(),
      `$${s.subtotal}`,
      `$${s.descuentos}`,
      `$${s.total}`,
    ]),
    foot: [["", "", "", "", `TOTAL: $${totalGeneral}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-pagos-${lugarActual.toLowerCase().replace(" ", "-")}-${semanaId}.pdf`);
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

  const { payments } = calculatePayments(
    coaches.filter((c) => c.id === coachId),
    schedules,
    discounts,
    semanaId,
    lugarActual
  );
  const summary = payments[0];
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
        "Subtotal",
        `${summary.clases} clases`,
        `$${summary.subtotal}`,
      ],
      ["Descuentos", `${summary.descuentos} en descuentos`, `-$${summary.descuentos}`],
    ],
    foot: [["", "TOTAL A PAGAR", `$${summary.total}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`recibo-${coach.nombre.toLowerCase()}-${lugarActual.toLowerCase().replace(" ", "-")}-${semanaId}.pdf`);
}

export function generateConsolidatedPDF(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string
) {
  const LUGARES = ["Gimnasio A", "Gimnasio B"];
  const doc = new jsPDF();
  let currentY = 20;

  doc.setFontSize(18);
  doc.text("Reporte Consolidado Semanal", 14, currentY);
  currentY += 10;
  
  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId}`, 14, currentY);
  currentY += 8;
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, currentY);
  currentY += 15;

  let grandSubtotal = 0;

  // Subtotales por gimnasio (sin descuentos)
  LUGARES.forEach((lugar) => {
    const { payments } = calculatePayments(
      coaches, schedules, discounts, semanaId, lugar
    );

    if (payments.length === 0) return;

    // Calcular subtotal SIN descuentos
    const gymSubtotal = payments.reduce((sum, p) => sum + p.subtotal, 0);

    doc.setFontSize(14);
    doc.text(lugar, 14, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Coach", "Clases", "Subtotal"]],
      body: payments.map((s) => [
        s.coachNombre,
        s.clases.toString(),
        `$${s.subtotal}`,
      ]),
      foot: [["", "", `Subtotal: $${gymSubtotal}`]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    grandSubtotal += gymSubtotal;
  });

  // Descuentos consolidados
  const gymCodeA = "A";
  const gymCodeB = "B";
  const descuentosA = discounts.filter((d) => d.semanaId === semanaId && d.gym === gymCodeA);
  const descuentosB = discounts.filter((d) => d.semanaId === semanaId && d.gym === gymCodeB);
  const allDiscounts = [...descuentosA, ...descuentosB];
  const grandDiscounts = allDiscounts.reduce((sum, d) => sum + d.monto, 0);

  if (allDiscounts.length > 0) {
    doc.setFontSize(14);
    doc.text("Descuentos", 14, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Coach", "Concepto", "Gimnasio", "Monto"]],
      body: allDiscounts.map((d) => {
        const coach = coaches.find((c) => c.id === d.coachId);
        const gym = d.gym === gymCodeA ? "Gimnasio A" : "Gimnasio B";
        return [
          coach?.nombre || "N/A",
          d.concepto,
          gym,
          `-$${d.monto}`,
        ];
      }),
      foot: [["", "", "Total Descuentos:", `-$${grandDiscounts}`]],
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Total consolidado
  doc.setFontSize(14);
  doc.text("Total Consolidado", 14, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    body: [
      ["Subtotal General", `$${grandSubtotal}`],
      ["Total Descuentos", `-$${grandDiscounts}`],
      ["TOTAL A PAGAR", `$${grandSubtotal - grandDiscounts}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-consolidado-${semanaId}.pdf`);
}

export function generateGymPDF(
  coaches: Coach[],
  schedules: Record<string, WeekSchedule>,
  discounts: Discount[],
  semanaId: string,
  lugar: string
) {
  const gymCode = getGymCode(lugar);
  const { payments, totalDescuentos } = calculatePayments(
    coaches, schedules, discounts, semanaId, lugar
  );

  // Calcular subtotal SIN descuentos
  const gymSubtotal = payments.reduce((sum, p) => sum + p.subtotal, 0);

  // Descuentos de este gym solamente
  const gymDiscounts = discounts.filter(
    (d) => d.semanaId === semanaId && d.gym === gymCode
  );

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(`Reporte de Pagos - ${lugar}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId}`, 14, 32);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, 40);

  autoTable(doc, {
    startY: 50,
    head: [
      ["Coach", "Clases", "Subtotal"],
    ],
    body: payments.map((s) => [
      s.coachNombre,
      s.clases.toString(),
      `$${s.subtotal}`,
    ]),
    foot: [["", "", `Subtotal: $${gymSubtotal}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // Descuentos de este gym
  if (gymDiscounts.length > 0) {
    doc.setFontSize(14);
    doc.text("Descuentos", 14, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Coach", "Concepto", "Monto"]],
      body: gymDiscounts.map((d) => {
        const coach = coaches.find((c) => c.id === d.coachId);
        return [
          coach?.nombre || "N/A",
          d.concepto,
          `-$${d.monto}`,
        ];
      }),
      foot: [["", "Total Descuentos:", `-$${totalDescuentos}`]],
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Total
  doc.setFontSize(14);
  doc.text("Total", 14, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    body: [
      ["Subtotal", `$${gymSubtotal}`],
      ["Descuentos", `-$${totalDescuentos}`],
      ["TOTAL A PAGAR", `$${gymSubtotal - totalDescuentos}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-${lugar.toLowerCase().replace(" ", "-")}-${semanaId}.pdf`);
}
