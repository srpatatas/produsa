"use client";

import { matches } from "@/data/matches";
import { usePredictions } from "@/context/PredictionsContext";

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

function StatCard({ value, label, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-card-bg p-3 shadow-sm shadow-black/20 ring-1 ring-white/5">
      <span className={`font-display text-2xl ${color}`}>{value}</span>
      <span className="text-[10px] text-fifa-dark-gray">{label}</span>
    </div>
  );
}

export function PredictionStats() {
  const { predictions, isLoaded } = usePredictions();

  if (!isLoaded) return null;

  const total = matches.length;
  const predicted = matches.filter((m) => predictions[m.id]).length;
  const remaining = total - predicted;
  const percentage = total > 0 ? Math.round((predicted / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard value={predicted} label="Predichos" color="text-fifa-blue" />
      <StatCard value={remaining} label="Restantes" color="text-fifa-dark-gray" />
      <StatCard value={`${percentage}%`} label="Completado" color={percentage === 100 ? "text-fifa-green" : "text-fifa-purple"} />
    </div>
  );
}
