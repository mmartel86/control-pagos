"use client";

import { useApp } from "@/lib/store";
import { Building2 } from "lucide-react";

export default function GymBanner() {
  const { lugarActual } = useApp();

  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
      <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm font-medium text-blue-900">
        Viendo: <span className="font-bold">{lugarActual}</span>
      </span>
      <span className="text-xs text-blue-600 ml-auto hidden sm:block">
        Cambia en el menú lateral
      </span>
    </div>
  );
}
