"use client";

import { useApp } from "@/lib/store";
import { generateConsolidatedPDF, generateGymPDF } from "@/lib/calculations";
import { Download, CheckCircle } from "lucide-react";
import GymBanner from "@/components/GymBanner";
import CoachPreview from "@/components/CoachPreview";

export default function PagosPage() {
  const { coaches, schedules, discounts, semanaActual, calculateConsolidatedPayments, closeWeek, loading } = useApp();
  
  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Cargando datos...</div></div>;
  }

  const consolidatedData = calculateConsolidatedPayments(semanaActual);
  
  // Descuentos por gym
  const discountsA = discounts.filter((d) => d.semanaId === semanaActual && d.gym === "A");
  const discountsB = discounts.filter((d) => d.semanaId === semanaActual && d.gym === "B");
  const totalDescuentosA = discountsA.reduce((sum, d) => sum + d.monto, 0);
  const totalDescuentosB = discountsB.reduce((sum, d) => sum + d.monto, 0);
  const totalDescuentos = totalDescuentosA + totalDescuentosB;
  
  // Subtotales por gym (sin descuentos)
  const gymA = consolidatedData.find((g) => g.gym === "Gimnasio A");
  const gymB = consolidatedData.find((g) => g.gym === "Gimnasio B");
  const subtotalA = gymA ? gymA.payments.reduce((s, p) => s + p.subtotal, 0) : 0;
  const subtotalB = gymB ? gymB.payments.reduce((s, p) => s + p.subtotal, 0) : 0;
  const subtotalGeneral = subtotalA + subtotalB;
  const totalAPagar = subtotalGeneral - totalDescuentos;

  const handleCloseWeek = () => {
    if (subtotalGeneral === 0) {
      alert("No hay datos para cerrar. Agrega coaches al horario primero.");
      return;
    }
    if (confirm(`¿Cerrar la semana ${semanaActual}? Los datos se guardarán y se iniciará una nueva semana.`)) {
      closeWeek();
    }
  };

  const gymData = [
    { name: "Gimnasio A", data: gymA, subtotal: subtotalA, discounts: discountsA, totalDescuentos: totalDescuentosA },
    { name: "Gimnasio B", data: gymB, subtotal: subtotalB, discounts: discountsB, totalDescuentos: totalDescuentosB },
  ];

  return (
    <div>
      <GymBanner />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resumen de Pagos</h1>
        <p className="text-gray-500">Semana {semanaActual} | Vista Consolidada</p>
      </div>

      {/* Secciones por gimnasio */}
      <div className="space-y-6 mb-6">
        {gymData.map((gym) => (
          <div key={gym.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header del gym */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg text-gray-900">{gym.name}</h2>
                {gym.data && gym.data.payments.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {gym.data.payments.reduce((s, p) => s + p.clases, 0)} clases
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {gym.data && gym.data.payments.length > 0 && (
                  <button
                    onClick={() => generateGymPDF(coaches, schedules, discounts, semanaActual, gym.name)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                )}
                <span className="font-bold text-lg text-gray-900">
                  ${gym.data ? gym.data.payments.reduce((s, p) => s + p.total, 0) : 0}
                </span>
              </div>
            </div>

            {/* Tabla de coaches */}
            {gym.data && gym.data.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Coach</th>
                      <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Clases</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Descuento</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">A Pagar</th>
                      <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gym.data.payments.map((p) => (
                      <tr key={p.coachId} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: coaches.find((c) => c.id === p.coachId)?.color }}
                            />
                            <span className="font-medium text-gray-900">{p.coachNombre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600">{p.clases}</td>
                        <td className="px-5 py-3 text-right text-gray-600">${p.subtotal}</td>
                        <td className="px-5 py-3 text-right text-red-500">
                          {p.descuentos > 0 ? `-$${p.descuentos}` : "-"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-green-600">${p.total}</td>
                        <td className="px-5 py-3 text-center">
                          <CoachPreview
                            coachId={p.coachId}
                            coachNombre={p.coachNombre}
                            color={coaches.find((c) => c.id === p.coachId)?.color || "#6B7280"}
                            gym={gym.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                Sin datos para esta semana
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Descuentos por gym */}
      {(discountsA.length > 0 || discountsB.length > 0) && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden mb-6">
          <div className="bg-red-50 px-5 py-4 border-b border-red-200 flex items-center justify-between">
            <h2 className="font-bold text-lg text-red-900">Descuentos</h2>
            <span className="font-bold text-lg text-red-600">-${totalDescuentos}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-red-100">
            {/* Descuentos Gimnasio A */}
            <div className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Gimnasio A</h3>
              {discountsA.length > 0 ? (
                <div className="space-y-2">
                  {discountsA.map((d) => {
                    const coach = coaches.find((c) => c.id === d.coachId);
                    return (
                      <div key={d.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-800">{coach?.nombre || "N/A"}</span>
                          {" — "}
                          {d.concepto}
                        </span>
                        <span className="font-semibold text-red-500">-${d.monto}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-red-100 pt-2 mt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-700">Subtotal descuentos A:</span>
                    <span className="text-red-600">-${totalDescuentosA}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin descuentos</p>
              )}
            </div>

            {/* Descuentos Gimnasio B */}
            <div className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Gimnasio B</h3>
              {discountsB.length > 0 ? (
                <div className="space-y-2">
                  {discountsB.map((d) => {
                    const coach = coaches.find((c) => c.id === d.coachId);
                    return (
                      <div key={d.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-800">{coach?.nombre || "N/A"}</span>
                          {" — "}
                          {d.concepto}
                        </span>
                        <span className="font-semibold text-red-500">-${d.monto}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-red-100 pt-2 mt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-700">Subtotal descuentos B:</span>
                    <span className="text-red-600">-${totalDescuentosB}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin descuentos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumen Final */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-blue-100 px-5 py-4 border-b border-blue-200 flex items-center justify-between">
          <h2 className="font-bold text-xl text-blue-900">Resumen Final</h2>
          <button
            onClick={() => generateConsolidatedPDF(coaches, schedules, discounts, semanaActual)}
            className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium"
          >
            <Download className="w-4 h-4" />
            PDF Consolidado
          </button>
        </div>
        
        <div className="p-5 space-y-3">
          {/* Totales por gym (con descuentos aplicados) */}
          {gymData.map((g) => {
            const totalGym = g.data ? g.data.payments.reduce((s, p) => s + p.total, 0) : 0;
            return (
              <div key={g.name} className="flex justify-between text-lg">
                <span className="text-blue-700 font-medium">{g.name}:</span>
                <span className="font-bold text-blue-900">${totalGym}</span>
              </div>
            );
          })}
          
          <div className="border-t border-blue-200 pt-3">
            <div className="flex justify-between text-lg text-gray-700">
              <span>Subtotal general:</span>
              <span className="font-semibold">${subtotalGeneral}</span>
            </div>
          </div>
          
          {totalDescuentos > 0 && (
            <div className="flex justify-between text-lg text-red-600">
              <span>Descuentos:</span>
              <span className="font-semibold">-${totalDescuentos}</span>
            </div>
          )}
          
          <div className="border-t-2 border-blue-300 pt-3 mt-3">
            <div className="flex justify-between text-2xl font-bold">
              <span className="text-blue-900">TOTAL A PAGAR:</span>
              <span className="text-blue-900">${totalAPagar}</span>
            </div>
          </div>
        </div>
        
        {/* Botón cerrar semana */}
        <div className="px-5 pb-5">
          <button
            onClick={handleCloseWeek}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Cerrar Semana
          </button>
        </div>
      </div>
    </div>
  );
}
