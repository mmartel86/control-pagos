"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { LUGARES, DIAS } from "@/lib/types";
import { X, FileText, Download } from "lucide-react";
import { generateConsolidatedPDF, generateGymPDF } from "@/lib/calculations";

export default function ConsolidatedPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const { coaches, schedules, discounts, semanaActual } = useApp();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Calcular subtotales por gimnasio SIN descuentos
  const gymData = LUGARES.map((lugar) => {
    const key = `${semanaActual}_${lugar}`;
    const schedule = schedules[key];

    if (!schedule) {
      return { gym: lugar, payments: [], subtotal: 0 };
    }

    const coachClassCount: Record<string, number> = {};
    const coachEarnings: Record<string, number> = {};

    for (const dia of DIAS) {
      const daySlots = schedule.horarios[dia];
      if (!daySlots) continue;
      for (const slotId of Object.keys(daySlots)) {
        const cell = daySlots[slotId];
        if (cell.coachId && cell.coachId !== "TRAINING") {
          coachClassCount[cell.coachId] = (coachClassCount[cell.coachId] || 0) + 1;
          const coach = coaches.find((c) => c.id === cell.coachId);
          if (coach) {
            const tarifa = cell.tarifaOverride ?? coach.tarifa;
            coachEarnings[cell.coachId] = (coachEarnings[cell.coachId] || 0) + tarifa;
          }
        }
      }
    }

    // Filtrar coaches por gym
    const gymCode = lugar === "Gimnasio A" ? "A" : "B";
    const gymCoaches = coaches.filter((c) => c.gym === gymCode);

    const payments = gymCoaches
      .filter((c) => coachClassCount[c.id])
      .map((coach) => ({
        coachId: coach.id,
        coachNombre: coach.nombre,
        clases: coachClassCount[coach.id],
        subtotal: coachEarnings[coach.id] || 0,
        color: coach.color,
      }))
      .sort((a, b) => b.subtotal - a.subtotal);

    const subtotal = payments.reduce((sum, p) => sum + p.subtotal, 0);

    return { gym: lugar, payments, subtotal };
  });

  // Descuentos totales (todos los gimnasios juntos)
  const allDiscounts = discounts.filter((d) => d.semanaId === semanaActual);
  const totalDescuentos = allDiscounts.reduce((sum, d) => sum + d.monto, 0);

  // Totales
  const subtotalGeneral = gymData.reduce((sum, g) => sum + g.subtotal, 0);
  const totalAPagar = subtotalGeneral - totalDescuentos;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700"
      >
        <FileText className="w-4 h-4" />
        Vista Previa Consolidada
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resumen Consolidado</h2>
                <p className="text-sm text-gray-500">Semana {semanaActual}</p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Subtotales por gimnasio */}
              {gymData.map((gym) => (
                <div key={gym.gym} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{gym.gym}</h3>
                    {gym.payments.length === 0 && (
                      <span className="text-xs text-gray-400">Sin datos</span>
                    )}
                  </div>

                  {gym.payments.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coach</th>
                            <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Clases</th>
                            <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {gym.payments.map((p) => (
                            <tr key={p.coachId} className="hover:bg-gray-50">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <span className="font-medium text-gray-900">{p.coachNombre}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center text-gray-600">{p.clases}</td>
                              <td className="px-5 py-3 text-right font-medium text-gray-900">${p.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                          <tr>
                            <td colSpan={2} className="px-5 py-3 text-right text-gray-700">Subtotal {gym.gym}:</td>
                            <td className="px-5 py-3 text-right text-gray-900">${gym.subtotal}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Descuentos */}
              {allDiscounts.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                    <h3 className="font-semibold text-red-900">Descuentos</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {allDiscounts.map((d) => {
                      const coach = coaches.find((c) => c.id === d.coachId);
                      return (
                        <div key={d.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {coach?.nombre} — {d.concepto}
                          </span>
                          <span className="text-red-600 font-medium">-${d.monto}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-red-200 pt-2 mt-2 flex justify-between font-semibold">
                      <span className="text-red-700">Total Descuentos:</span>
                      <span className="text-red-600">-${totalDescuentos}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Consolidado */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-blue-900 mb-3">Total Consolidado</h3>
                <div className="space-y-2">
                  {gymData.map((gym) => (
                    <div key={gym.gym} className="flex justify-between text-sm">
                      <span className="text-blue-700">{gym.gym}:</span>
                      <span className="font-semibold text-blue-900">${gym.subtotal}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotalGeneral}</span>
                    </div>
                    {totalDescuentos > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuentos:</span>
                        <span>-${totalDescuentos}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-blue-200">
                      <span className="text-blue-900">TOTAL A PAGAR:</span>
                      <span className="text-blue-900">${totalAPagar}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => generateConsolidatedPDF(coaches, schedules, discounts, semanaActual)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  PDF Consolidado
                </button>
                {gymData.map((gym) => (
                  gym.payments.length > 0 && (
                    <button
                      key={gym.gym}
                      onClick={() => generateGymPDF(coaches, schedules, discounts, semanaActual, gym.gym)}
                      className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      PDF {gym.gym}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
