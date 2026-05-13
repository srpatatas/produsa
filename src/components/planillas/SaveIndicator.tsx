"use client";

import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

export function SaveIndicator() {
  const { saveStatus } = usePlanilla();

  if (saveStatus === "idle") return null;

  return (
    <div className="fixed bottom-28 left-1/2 z-[90] -translate-x-1/2 md:bottom-8">
      <div
        className={cn(
          "rounded-xl px-4 py-2 text-xs font-medium shadow-xl transition-all duration-300",
          saveStatus === "saving" && "bg-fifa-blue/90 text-white",
          saveStatus === "saved" && "bg-fifa-green/90 text-white",
          saveStatus === "error" && "bg-fifa-red/90 text-white",
        )}
      >
        {saveStatus === "saving" && "Guardando..."}
        {saveStatus === "saved" && "✓ Guardado"}
        {saveStatus === "error" && "✗ Error al guardar — intentá de nuevo"}
      </div>
    </div>
  );
}
