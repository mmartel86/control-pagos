"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import GymBanner from "@/components/GymBanner";

export default function DescuentosPage() {
  const { coaches, discounts, semanaActual, lugarActual, addDiscount, removeDiscount, loading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coachId: "", concepto: "", monto: "" });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Cargando datos...</div></div>;
  }

  const gymCode = lugarActual === "Gimnasio A" ? "A" : "B";
  const weekDiscounts = discounts.filter((d) => d.semanaId === semanaActual && d.gym === gymCode);

  const handleSave = () => {
    if (!form.coachId || !form.concepto.trim() || !form.monto || Number(form.monto) <= 0) return;
    addDiscount({ ...form, monto: Number(form.monto), semanaId: semanaActual });
    setForm({ coachId: "", concepto: "", monto: "" });
    setShowForm(false);
  };

  const totalDescuentos = weekDiscounts.reduce((sum, d) => sum + d.monto, 0);

  return (
    <div>
      <GymBanner />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Descuentos</h1>
        <p className="text-gray-500">Registra descuentos por coach para la semana {semanaActual}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {weekDiscounts.length} descuentos registrados | Total: <span className="font-semibold text-red-500">${totalDescuentos}</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Agregar Descuento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coach</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Concepto</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {weekDiscounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                  No hay descuentos registrados para esta semana.
                </td>
              </tr>
            ) : (
              weekDiscounts.map((d) => {
                const coach = coaches.find((c) => c.id === d.coachId);
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{coach?.nombre || "N/A"}</td>
                    <td className="px-5 py-3 text-gray-600">{d.concepto}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-500">-${d.monto}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => removeDiscount(d.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nuevo Descuento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar coach...</option>
                  {coaches.filter((c) => c.gym === gymCode).map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: Snack, Agua, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <input
                  type="number"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                  min="0"
                  step="0.50"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
