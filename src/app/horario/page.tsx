"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { DIAS, LUGARES } from "@/lib/types";
import { Upload, GripVertical, DollarSign } from "lucide-react";
import GymBanner from "@/components/GymBanner";

export default function HorarioPage() {
  const {
    coaches,
    timeSlots,
    semanaActual,
    lugarActual,
    setLugarActual,
    setSemanaActual,
    getScheduleKey,
    setScheduleCell,
    clearSchedule,
    schedules,
    loading,
  } = useApp();

  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragCell, setDragCell] = useState<{ dia: string; slotId: string } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [tarifaInput, setTarifaInput] = useState<string>("");
  const [pendingCoachId, setPendingCoachId] = useState<string | null>(null);
  const [pendingCell, setPendingCell] = useState<{ dia: string; slotId: string } | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Cargando datos...</div></div>;
  }

  // Filtrar por gym actual
  const gymCode = lugarActual === "Gimnasio A" ? "A" : "B";
  const filteredCoaches = coaches.filter((c) => c.gym === gymCode);
  const filteredTimeSlots = timeSlots.filter((t) => t.gym === gymCode);

  const key = getScheduleKey();
  const schedule = schedules[key] || { semanaId: semanaActual, lugar: lugarActual, horarios: {} };

  const getCell = (dia: string, slotId: string) => {
    return schedule.horarios[dia]?.[slotId] || null;
  };

  const getCellCoachId = (dia: string, slotId: string) => {
    return getCell(dia, slotId)?.coachId || null;
  };

  const getCellTarifa = (dia: string, slotId: string) => {
    return getCell(dia, slotId)?.tarifaOverride || null;
  };

  const getCoachName = (coachId: string | null) => {
    if (!coachId) return "";
    const coach = filteredCoaches.find((c) => c.id === coachId);
    return coach ? coach.nombre : coachId;
  };

  const getCoachColor = (coachId: string | null) => {
    if (!coachId) return "";
    const coach = filteredCoaches.find((c) => c.id === coachId);
    return coach ? coach.color : "#6B7280";
  };

  const getCoachTarifa = (coachId: string | null) => {
    if (!coachId) return null;
    const coach = filteredCoaches.find((c) => c.id === coachId);
    return coach ? coach.tarifa : null;
  };

  const handleOpenDropdown = (dia: string, slotId: string, event: React.MouseEvent) => {
    const cell = getCell(dia, slotId);
    const coachId = cell?.coachId || null;
    const override = cell?.tarifaOverride;
    setTarifaInput(override != null ? String(override) : coachId ? String(getCoachTarifa(coachId) || "") : "");
    setPendingCoachId(coachId);
    setPendingCell({ dia, slotId });
    
    // Calcular posición basada en la celda clickeada
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    
    setShowDropdown(`${dia}-${slotId}`);
  };

  const handleTarifaChange = (nuevaTarifa: string) => {
    if (!pendingCell) return;
    const { dia, slotId } = pendingCell;
    const tarifa = nuevaTarifa ? Number(nuevaTarifa) : null;
    setScheduleCell(semanaActual, dia, slotId, pendingCoachId, tarifa);
    setTarifaInput(nuevaTarifa);
  };

  const handleSelectCoach = (coachId: string | null) => {
    // Guardar inmediatamente al hacer click en el coach
    if (!pendingCell) return;
    const { dia, slotId } = pendingCell;
    const coach = filteredCoaches.find((c) => c.id === coachId);
    const tarifa = coach ? coach.tarifa : null;
    setScheduleCell(semanaActual, dia, slotId, coachId, tarifa);
    setShowDropdown(null);
    setPendingCell(null);
    setPendingCoachId(null);
    setTarifaInput("");
  };

  const handleConfirmCell = () => {
    if (!pendingCell) return;
    const { dia, slotId } = pendingCell;
    const tarifa = tarifaInput ? Number(tarifaInput) : null;
    setScheduleCell(semanaActual, dia, slotId, pendingCoachId, tarifa);
    setShowDropdown(null);
    setPendingCell(null);
    setPendingCoachId(null);
    setTarifaInput("");
  };

  const handleClearCell = () => {
    if (!pendingCell) return;
    const { dia, slotId } = pendingCell;
    setScheduleCell(semanaActual, dia, slotId, null, null);
    setShowDropdown(null);
    setPendingCell(null);
    setPendingCoachId(null);
    setTarifaInput("");
  };

  // Drag & Drop handlers
  const handleDragStart = (dia: string, slotId: string) => {
    const coachId = getCellCoachId(dia, slotId);
    if (coachId) {
      setDragCell({ dia, slotId });
    }
  };

  const handleDragOver = (e: React.DragEvent, dia: string, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`${dia}-${slotId}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDia: string, targetSlotId: string) => {
    e.preventDefault();
    setDragOverCell(null);

    if (!dragCell) return;

    const sourceCell = getCell(dragCell.dia, dragCell.slotId);
    const targetCell = getCell(targetDia, targetSlotId);
    const sourceCoachId = sourceCell?.coachId || null;
    const targetCoachId = targetCell?.coachId || null;

    if (!sourceCoachId) return;

    // If dropping on same cell, do nothing
    if (dragCell.dia === targetDia && dragCell.slotId === targetSlotId) {
      setDragCell(null);
      return;
    }

    // Move source coach to target (keep tarifaOverride)
    setScheduleCell(semanaActual, targetDia, targetSlotId, sourceCoachId, sourceCell?.tarifaOverride ?? null);

    // If target had a coach, swap them; otherwise clear source
    setScheduleCell(
      semanaActual,
      dragCell.dia,
      dragCell.slotId,
      targetCoachId,
      targetCell?.tarifaOverride ?? null
    );

    setDragCell(null);
  };

  const handleDragEnd = () => {
    setDragCell(null);
    setDragOverCell(null);
  };

  return (
    <div>
      <GymBanner />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Horario Semanal</h1>
        <p className="text-gray-500">Asigna coaches a cada franja horaria</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Semana:</label>
          <input
            type="text"
            value={semanaActual}
            onChange={(e) => setSemanaActual(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Lugar:</label>
          <select
            value={lugarActual}
            onChange={(e) => setLugarActual(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {LUGARES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          Subir Excel
        </button>
        <button
          onClick={clearSchedule}
          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          Limpiar Horario
        </button>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-start gap-2">
        <DollarSign className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Tarifa por clase:</span> Al asignar un coach, puedes cambiar la tarifa para esa clase especifica. Si un coach cobra diferente segun la hora, solo ajusta el monto en la celda. El calculo final usara la tarifa que pusiste en cada horario.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Hora</th>
                {DIAS.map((dia) => (
                  <th key={dia} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTimeSlots.map((slot, slotIndex) => {
                const openUp = slotIndex >= timeSlots.length / 2;
                return (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                    <div>{slot.horaInicio}</div>
                    <div className="text-gray-400">{slot.horaFin}</div>
                  </td>
                  {DIAS.map((dia) => {
                    const cell = getCell(dia, slot.id);
                    const coachId = cell?.coachId || null;
                    const tarifaOverride = cell?.tarifaOverride || null;
                    const isDropdownOpen = showDropdown === `${dia}-${slot.id}`;
                    const cellKey = `${dia}-${slot.id}`;
                    const isDragging = dragCell?.dia === dia && dragCell?.slotId === slot.id;
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td key={dia} className="px-1 py-1 relative">
                        <div
                          draggable={!!coachId}
                          onDragStart={() => handleDragStart(dia, slot.id)}
                          onDragOver={(e) => handleDragOver(e, dia, slot.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, dia, slot.id)}
                          onDragEnd={handleDragEnd}
                          className={`w-full min-h-[44px] px-2 py-1.5 rounded-md text-sm font-medium border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            coachId
                              ? "border-transparent text-white cursor-grab active:cursor-grabbing"
                              : "border-dashed border-gray-200 text-gray-400 hover:border-gray-300"
                          } ${
                            isDragging ? "opacity-40 scale-95" : ""
                          } ${
                            isDragOver && !isDragging ? "ring-2 ring-blue-400 ring-offset-1 bg-blue-50" : ""
                          }`}
                          style={coachId ? { backgroundColor: getCoachColor(coachId) } : {}}
                          onClick={(e) => isDropdownOpen ? setShowDropdown(null) : handleOpenDropdown(dia, slot.id, e)}
                        >
                          {coachId && <GripVertical className="w-3 h-3 opacity-60 flex-shrink-0 absolute top-1 left-1" />}
                          <span>{coachId ? getCoachName(coachId) : "+"}</span>
                          {tarifaOverride != null && (
                            <span className="text-[10px] opacity-80 font-normal">${tarifaOverride}</span>
                          )}
                        </div>
                        {isDropdownOpen && pendingCell && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => { setShowDropdown(null); setPendingCell(null); }}
                            />
                            <div
                              className="fixed z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
                              style={{ top: dropdownPos.top, left: dropdownPos.left }}
                            >
                              {pendingCoachId ? (
                                // Celda con coach asignado: mostrar opciones de tarifa
                                <div className="p-3">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: getCoachColor(pendingCoachId) }}
                                    />
                                    <span className="font-medium text-sm">{getCoachName(pendingCoachId)}</span>
                                  </div>
                                  <label className="text-[11px] text-gray-400 mb-1 block">
                                    Tarifa para esta clase:
                                  </label>
                                  <div className="flex items-center gap-1 mb-2">
                                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                    <input
                                      type="number"
                                      value={tarifaInput}
                                      onChange={(e) => handleTarifaChange(e.target.value)}
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                      placeholder={String(getCoachTarifa(pendingCoachId) || "")}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleSelectCoach(null)}
                                    className="w-full text-xs text-red-600 hover:bg-red-50 py-1.5 rounded"
                                  >
                                    Quitar coach
                                  </button>
                                </div>
                              ) : (
                                // Celda vacía: mostrar lista de coaches
                                <div className="p-2">
                                  <p className="text-[11px] text-gray-400 mb-1.5">Selecciona un coach:</p>
                                  {filteredCoaches.map((coach) => (
                                    <button
                                      key={coach.id}
                                      onClick={() => handleSelectCoach(coach.id)}
                                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded"
                                    >
                                      <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: coach.color }}
                                      />
                                      {coach.nombre}
                                      <span className="text-xs text-gray-400 ml-auto">${coach.tarifa}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><GripVertical className="w-3 h-3" /> Arrastra un coach para moverlo</span>
        <span>Click para abrir menu</span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> Cambia la tarifa por clase en cada celda
        </span>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Subir Horario Excel</h3>
            <p className="text-sm text-gray-500 mb-4">
              Arrastra tu archivo Excel aqui o haz clic para seleccionar.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Formato: dias en columnas, horas en filas</p>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Pronto: importacion automatica desde Excel.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
