"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { COACH_COLORS } from "@/lib/types";
import { Plus, Trash2, Edit3 } from "lucide-react";

export default function ConfigPage() {
  const {
    coaches,
    timeSlots,
    addCoach,
    removeCoach,
    updateCoach,
    addTimeSlot,
    removeTimeSlot,
    loading,
  } = useApp();

  const [tab, setTab] = useState<"coaches" | "horarios">("coaches");
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<string | null>(null);
  const [coachForm, setCoachForm] = useState({ nombre: "", tipoTarifa: "hora" as "hora" | "fija", tarifa: 30, color: COACH_COLORS[0] });
  const [slotForm, setSlotForm] = useState({ horaInicio: "06:10", horaFin: "07:00" });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Cargando datos...</div></div>;
  }

  const handleSaveCoach = () => {
    if (!coachForm.nombre.trim()) return;
    if (editingCoach) {
      updateCoach(editingCoach, coachForm);
      setEditingCoach(null);
    } else {
      addCoach(coachForm);
    }
    setCoachForm({ nombre: "", tipoTarifa: "hora", tarifa: 30, color: COACH_COLORS[0] });
    setShowCoachForm(false);
  };

  const handleEditCoach = (id: string) => {
    const coach = coaches.find((c) => c.id === id);
    if (coach) {
      setEditingCoach(id);
      setCoachForm({ nombre: coach.nombre, tipoTarifa: coach.tipoTarifa, tarifa: coach.tarifa, color: coach.color });
      setShowCoachForm(true);
    }
  };

  const handleSaveSlot = () => {
    if (!slotForm.horaInicio || !slotForm.horaFin) return;
    addTimeSlot(slotForm);
    setSlotForm({ horaInicio: "06:10", horaFin: "07:00" });
    setShowSlotForm(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-500">Administra coaches y franjas horarias</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("coaches")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "coaches" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Coaches
        </button>
        <button
          onClick={() => setTab("horarios")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "horarios" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Franjas Horarias
        </button>
      </div>

      {tab === "coaches" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{coaches.length} coaches registrados</p>
            <button
              onClick={() => { setShowCoachForm(true); setEditingCoach(null); setCoachForm({ nombre: "", tipoTarifa: "hora", tarifa: 30, color: COACH_COLORS[0] }); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Agregar Coach
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coach</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tipo Tarifa</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tarifa</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: coach.color }} />
                        <span className="font-medium text-gray-900">{coach.nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{coach.tipoTarifa}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">${coach.tarifa}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleEditCoach(coach.id)} className="text-gray-400 hover:text-blue-600 mr-3">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeCoach(coach.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {showCoachForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">{editingCoach ? "Editar Coach" : "Nuevo Coach"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={coachForm.nombre}
                      onChange={(e) => setCoachForm({ ...coachForm, nombre: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: MUCIA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarifa</label>
                    <select
                      value={coachForm.tipoTarifa}
                      onChange={(e) => setCoachForm({ ...coachForm, tipoTarifa: e.target.value as "hora" | "fija" })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="hora">Por Clase (varia segun hora)</option>
                      <option value="fija">Fija (misma tarifa siempre)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa ($)</label>
                    <input
                      type="number"
                      value={coachForm.tarifa}
                      onChange={(e) => setCoachForm({ ...coachForm, tarifa: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {COACH_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCoachForm({ ...coachForm, color: c })}
                          className={`w-8 h-8 rounded-full border-2 ${coachForm.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={() => setShowCoachForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                  <button onClick={handleSaveCoach} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingCoach ? "Guardar Cambios" : "Agregar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "horarios" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{timeSlots.length} franjas configuradas</p>
            <button
              onClick={() => setShowSlotForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Agregar Franja
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Hora Inicio</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Hora Fin</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((slot, i) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{slot.horaInicio}</td>
                    <td className="px-5 py-3 text-gray-600">{slot.horaFin}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => removeTimeSlot(slot.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {showSlotForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-semibold mb-4">Nueva Franja Horaria</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                    <input type="time" value={slotForm.horaInicio} onChange={(e) => setSlotForm({ ...slotForm, horaInicio: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                    <input type="time" value={slotForm.horaFin} onChange={(e) => setSlotForm({ ...slotForm, horaFin: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={() => setShowSlotForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                  <button onClick={handleSaveSlot} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Agregar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
