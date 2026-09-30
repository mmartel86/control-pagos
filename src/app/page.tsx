"use client";

import { useApp } from "@/lib/store";
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import GymBanner from "@/components/GymBanner";

export default function Dashboard() {
  const { coaches, schedules, discounts, semanaActual, lugarActual, calculatePayments, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando datos...</div>
      </div>
    );
  }
  const { payments, totalGeneral, totalDescuentos } = calculatePayments(semanaActual);

  const key = `${semanaActual}_${lugarActual}`;
  const schedule = schedules[key];
  const gymCode = lugarActual === "Gimnasio A" ? "A" : "B";
  
  let totalClases = 0;
  if (schedule) {
    for (const dia of Object.keys(schedule.horarios)) {
      const daySlots = schedule.horarios[dia];
      if (!daySlots) continue;
      for (const slotId of Object.keys(daySlots)) {
        const cell = daySlots[slotId];
        if (cell.coachId && cell.coachId !== "TRAINING") {
          // Solo contar si el coach pertenece a este gym
          const coach = coaches.find((c) => c.id === cell.coachId);
          if (coach && coach.gym === gymCode) {
            totalClases++;
          }
        }
      }
    }
  }

  const stats = [
    { label: "Coaches activos", value: payments.length, icon: Users, color: "bg-blue-500" },
    { label: "Clases esta semana", value: totalClases, icon: Calendar, color: "bg-green-500" },
    { label: "Total a pagar", value: `$${totalGeneral}`, icon: DollarSign, color: "bg-purple-500" },
    { label: "Descuentos", value: `$${totalDescuentos}`, icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div>
      <GymBanner />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Semana {semanaActual} | {lugarActual}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} text-white p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Resumen por Coach - {lugarActual}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[450px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coach</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Clases</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Descuento</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">A Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                  No hay datos de horario para esta semana. Ve a la seccion Horario para asignar coaches.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.coachId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.coachNombre}</td>
                  <td className="px-5 py-3 text-center text-gray-600">{p.clases}</td>
                  <td className="px-5 py-3 text-right text-gray-600">${p.subtotal}</td>
                  <td className="px-5 py-3 text-right text-red-500">
                    {p.descuentos > 0 ? `-$${p.descuentos}` : "-"}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-green-600 text-lg">${p.total}</td>
                </tr>
              ))
            )}
          </tbody>
          {payments.length > 0 && (
            <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
              <tr>
                <td colSpan={2} className="px-5 py-3 text-right text-gray-700">Total {lugarActual}:</td>
                <td className="px-5 py-3 text-right text-gray-900">${payments.reduce((s, p) => s + p.subtotal, 0)}</td>
                <td className="px-5 py-3 text-right text-red-500">
                  {totalDescuentos > 0 ? `-$${totalDescuentos}` : "-"}
                </td>
                <td className="px-5 py-3 text-right text-green-600 text-lg">${totalGeneral}</td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
    </div>
  );
}
