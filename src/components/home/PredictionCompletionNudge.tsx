"use client";

interface PredictionCompletionNudgeProps {
  predictionStatus: Record<string, { total: number; completed: number }>;
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
}

const scopeOrder = ["fecha-1", "fecha-2", "fecha-3", "R32", "R16", "QF", "SF", "FINAL"];

const scopeLabels: Record<string, string> = {
  "fecha-1": "F1",
  "fecha-2": "F2",
  "fecha-3": "F3",
  R32: "16vos",
  R16: "8vos",
  QF: "4tos",
  SF: "Semi",
  FINAL: "Final",
};

export function PredictionCompletionNudge({
  predictionStatus,
  locks,
}: PredictionCompletionNudgeProps) {
  const all = Object.entries(predictionStatus)
    .sort(([a], [b]) => (scopeOrder.indexOf(a) ?? 99) - (scopeOrder.indexOf(b) ?? 99));

  if (all.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface/60 px-4 py-2.5 ring-1 ring-white/5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
        Estado de predicciones
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {all.map(([scope, status]) => {
          const pct = Math.round((status.completed / status.total) * 100);
          const complete = pct === 100;
          return (
            <div key={scope} className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-fifa-dark-gray">
                {scopeLabels[scope] ?? scope}
              </span>
              <div className="h-1.5 w-14 rounded-full bg-white/5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    complete ? "bg-fifa-green" : "bg-fifa-blue"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${
                complete ? "text-fifa-green" : "text-fifa-dark-gray/70"
              }`}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
