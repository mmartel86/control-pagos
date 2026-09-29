"use client";

import { useApp } from "@/lib/store";
import { generateGeneralPDF, generateIndividualPDF } from "@/lib/calculations";
import { FileText, Download, CheckCircle } from "lucide-react";

export default function PagosPage() {
  const { coaches, schedules, discounts, semanaActual, lugarActual, calculatePayments, closeWeek, loading } = useApp();
  const payments = calculatePayments(semanaActual);
  const totalGeneral = payments.reduce((sum, p) => sum + p.total, 0);

  const handleCloseWeek = () => {
    if (payments.length === 0) {
      alert("No hay datos para cerrar. Agrega coaches al horario primero.");
      return;
    }
    if (confirm(`¿Cerrar la semana ${semanaActual}? Los datos se guardarán y se iniciará una nueva semana.`)) {
      closeWeek();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resumen de Pagos</h1>
        <p className="text-gray-500">Semana {semanaActual} | {lugarActual}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => generateGeneralPDF(coaches, schedules, discounts, semanaActual, lugarActual)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          PDF General
        </button>
        <button
          onClick={handleCloseWeek}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4" />
          Cerrar Semana
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coach</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Clases</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tarifa Prom./Clase</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Descuento</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No hay datos de pagos para esta semana. Primero asigna coaches en el horario.
                </td>
              </tr>
            ) : (
              <>
                {payments.map((p) => (
                  <tr key={p.coachId} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: coaches.find((c) => c.id === p.coachId)?.color }}
                        />
                        <span className="font-medium text-gray-900">{p.coachNombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{p.clases}</td>
                    <td className="px-5 py-3 text-right text-gray-600">${p.tarifaPorClase}</td>
                    <td className="px-5 py-3 text-right text-gray-600">${p.subtotal}</td>
                    <td className="px-5 py-3 text-right text-red-500">
                      {p.descuentos > 0 ? `-$${p.descuentos}` : "-"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">${p.total}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => generateIndividualPDF(coaches, schedules, discounts, semanaActual, lugarActual, p.coachId)}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="px-5 py-3 text-right text-gray-700">TOTAL GENERAL</td>
                  <td className="px-5 py-3 text-right text-red-500">
                    -${payments.reduce((s, p) => s + p.descuentos, 0)}
                  </td>
                  <td className="px-5 py-3 text-right text-lg text-gray-900">${totalGeneral}</td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {payments.map((p) => (
            <div key={p.coachId} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: coaches.find((c) => c.id === p.coachId)?.color }}
                />
                <span className="font-semibold text-gray-900">{p.coachNombre}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Clases</span>
                  <span className="text-gray-900">{p.clases} x ${p.tarifaPorClase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">${p.subtotal}</span>
                </div>
                {p.descuentos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Descuentos</span>
                    <span className="text-red-500">-${p.descuentos}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-100 pt-1">
                  <span>Total</span>
                  <span className="text-lg">${p.total}</span>
                </div>
              </div>
              <button
                onClick={() => generateIndividualPDF(coaches, schedules, discounts, semanaActual, lugarActual, p.coachId)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"
              >
                <FileText className="w-4 h-4" />
                Descargar PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
