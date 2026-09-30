"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { LUGARES } from "@/lib/types";
import { X, FileText } from "lucide-react";
import { generateIndividualPDF } from "@/lib/calculations";

interface CoachPreviewProps {
  coachId: string;
  coachNombre: string;
  color: string;
  gym?: string;
}

export default function CoachPreview({ coachId, coachNombre, color, gym }: CoachPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { coaches, schedules, discounts, semanaActual } = useApp();

  // Solo mostrar el gym indicado (o todos si no se especifica)
  const gymsToShow = gym ? [gym] : LUGARES;

  const coachData = gymsToShow.map((lugar) => {
    const key = `${semanaActual}_${lugar}`;
    const schedule = schedules[key];

    if (!schedule) {
      return { gym: lugar, clases: 0, subtotal: 0, breakdown: [] as { rate: number; count: number; subtotal: number }[] };
    }

    const clases = [];
    let subtotal = 0;

    for (const dia of Object.keys(schedule.horarios)) {
      const daySlots = schedule.horarios[dia];
      if (!daySlots) continue;
      for (const slotId of Object.keys(daySlots)) {
        const cell = daySlots[slotId];
        if (cell.coachId === coachId) {
          const coach = coaches.find((c) => c.id === coachId);
          const tarifa = cell.tarifaOverride ?? coach?.tarifa ?? 0;
          clases.push({ dia, slotId, tarifa });
          subtotal += tarifa;
        }
      }
    }

    // Agrupar por tarifa
    const breakdownMap = new Map<number, { count: number; subtotal: number }>();
    clases.forEach((c) => {
      const existing = breakdownMap.get(c.tarifa) || { count: 0, subtotal: 0 };
      breakdownMap.set(c.tarifa, {
        count: existing.count + 1,
        subtotal: existing.subtotal + c.tarifa,
      });
    });
    const breakdown = Array.from(breakdownMap.entries())
      .map(([rate, { count, subtotal: sub }]) => ({ rate, count, subtotal: sub }))
      .sort((a, b) => b.rate - a.rate);

    return {
      gym: lugar,
      clases: clases.length,
      subtotal,
      breakdown,
      detalle: clases,
    };
  });

  // Descuentos del coach del gym indicado
  const coachGym = gym === "Gimnasio A" ? "A" : gym === "Gimnasio B" ? "B" : coaches.find((c) => c.id === coachId)?.gym;
  const gymCode = coachGym === "A" ? "A" : "B";
  const gymName = gym || (coachGym === "A" ? "Gimnasio A" : "Gimnasio B");
  const coachDiscounts = discounts.filter(
    (d) => d.coachId === coachId && d.semanaId === semanaActual && d.gym === gymCode
  );
  const totalDescuentos = coachDiscounts.reduce((sum, d) => sum + d.monto, 0);

  const subtotalGeneral = coachData.reduce((sum, g) => sum + g.subtotal, 0);
  const totalClases = coachData.reduce((sum, g) => sum + g.clases, 0);
  const totalAPagar = subtotalGeneral - totalDescuentos;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"
      >
        <FileText className="w-4 h-4" />
        Ver Detalle
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <h2 className="text-xl font-bold text-gray-900">{coachNombre}</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-sm text-gray-500">
                Semana {semanaActual}
              </div>

              {/* Gimnasios */}
              {coachData.map((gym) => (
                <div key={gym.gym} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{gym.gym}</h3>
                    {gym.clases === 0 && (
                      <span className="text-xs text-gray-400">Sin clases</span>
                    )}
                  </div>

                  {gym.clases > 0 && (
                    <div className="p-5 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Clases impartidas:</p>
                        <div className="space-y-1">
                          {gym.breakdown.map((b, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {b.count} {b.count === 1 ? "clase" : "clases"} a ${b.rate}
                              </span>
                              <span className="text-gray-900 font-medium">${b.subtotal}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                        <span className="text-gray-700">Subtotal {gym.gym}:</span>
                        <span className="text-gray-900">${gym.subtotal}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Descuentos */}
              {coachDiscounts.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                    <h3 className="font-semibold text-red-900">Descuentos</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {coachDiscounts.map((d) => (
                      <div key={d.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{d.concepto}</span>
                        <span className="text-red-600 font-medium">-${d.monto}</span>
                      </div>
                    ))}
                    <div className="border-t border-red-200 pt-2 mt-2 flex justify-between font-semibold">
                      <span className="text-red-700">Total Descuentos:</span>
                      <span className="text-red-600">-${totalDescuentos}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Consolidado */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-blue-900 mb-3">Resumen Total</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total de clases:</span>
                    <span className="font-semibold text-blue-900">{totalClases}</span>
                  </div>
                  {coachData.map((gym) => (
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

              {/* Botón PDF */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    generateIndividualPDF(coaches, schedules, discounts, semanaActual, gymName, coachId);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
