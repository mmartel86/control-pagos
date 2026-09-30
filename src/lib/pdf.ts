import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentSummary } from "./types";

export function generateGeneralPDF(
  summaries: PaymentSummary[],
  semanaId: string
) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Pagos Semanales", 14, 22);

  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId}`, 14, 32);
  doc.text(
    `Fecha de generacion: ${new Date().toLocaleDateString("es-MX")}`,
    14,
    40
  );

  const totalGeneral = summaries.reduce((sum, s) => sum + s.total, 0);

  autoTable(doc, {
    startY: 50,
    head: [["Coach", "Clases", "Tarifa/Clase", "Subtotal", "Descuento", "Total"]],
    body: summaries.map((s) => [
      s.coachNombre,
      s.clases.toString(),
      `$${s.tarifaPorClase.toFixed(2)}`,
      `$${s.subtotal.toFixed(2)}`,
      `$${s.descuentos.toFixed(2)}`,
      `$${s.total.toFixed(2)}`,
    ]),
    foot: [["", "", "", "", "TOTAL:", `$${totalGeneral.toFixed(2)}`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-pagos-${semanaId}.pdf`);
}

export function generateIndividualPDF(
  summary: PaymentSummary,
  semanaId: string
) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Recibo de Pago", 14, 22);

  doc.setFontSize(14);
  doc.text(summary.coachNombre, 14, 36);

  doc.setFontSize(11);
  doc.text(`Semana: ${semanaId}`, 14, 48);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-MX")}`, 14, 56);

  doc.setFontSize(12);
  doc.text("Resumen de Clases", 14, 72);

  autoTable(doc, {
    startY: 78,
    head: [["Concepto", "Monto"]],
    body: [
      ["Clases impartidas", summary.clases.toString()],
      ["Tarifa por clase", `$${summary.tarifaPorClase.toFixed(2)}`],
      ["Subtotal", `$${summary.subtotal.toFixed(2)}`],
      ["Descuentos", `-$${summary.descuentos.toFixed(2)}`],
      ["TOTAL A PAGAR", `$${summary.total.toFixed(2)}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`recibo-${summary.coachNombre.toLowerCase()}-${semanaId}.pdf`);
}
