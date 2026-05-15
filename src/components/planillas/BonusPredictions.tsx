"use client";

import { useState } from "react";
import { bonusQuestions } from "@/data/bonusQuestions";
import { teams } from "@/data/teams";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

const teamOptions = Object.values(teams)
  .map((t) => ({ value: t.id, label: t.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const participantOptions = [
  "Fede", "Nico", "Mati", "Sofi", "Juanchi", "Caro", "Tincho", "Player 1",
].map((name) => ({ value: name, label: name }));

function BonusSelect({
  questionId,
  label,
  sourceType,
  locked,
}: {
  questionId: string;
  label: string;
  sourceType: string;
  locked?: boolean;
}) {
  const { bonusPredictions, setBonusPrediction } = usePlanilla();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const value = bonusPredictions[questionId] ?? "";

  const options =
    sourceType === "teams"
      ? teamOptions
      : sourceType === "participants"
        ? participantOptions
        : [];

  const isTextInput = sourceType === "players";
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  if (isTextInput) {
    return (
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setBonusPrediction(questionId, e.target.value)}
          placeholder="Escribí tu predicción"
          disabled={locked}
          className={cn(
            "w-full rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30",
            locked && "opacity-50 cursor-not-allowed",
          )}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !locked && setOpen(!open)}
        disabled={locked}
        className={cn(
          "flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs text-left ring-1 ring-white/5 transition-all",
          locked
            ? "opacity-50 cursor-not-allowed"
            : open ? "ring-fifa-teal/40" : "hover:ring-white/15",
          value ? "text-foreground" : "text-fifa-dark-gray/40",
        )}
      >
        <span className="truncate">{value ? selectedLabel : "Elegir..."}</span>
        <span className="text-fifa-dark-gray/40">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-card-bg shadow-xl shadow-black/30 ring-1 ring-white/10">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg bg-surface px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-fifa-dark-gray/30"
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto px-1 pb-1">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setBonusPrediction(questionId, o.value);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors",
                  o.value === value
                    ? "bg-fifa-teal/20 text-fifa-teal"
                    : "text-foreground hover:bg-white/5",
                )}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-fifa-dark-gray/40">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BonusPredictions({ locked }: { locked?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl bg-card-bg p-5 shadow-sm shadow-black/20 ring-1 ring-white/5",
      locked && "opacity-75",
    )}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-base uppercase tracking-wider text-fifa-gold">
        {locked && <span className="text-sm">🔒</span>}
        Puntos Extra
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bonusQuestions.map((q) => (
          <BonusSelect
            key={q.id}
            questionId={q.id}
            label={q.label}
            sourceType={q.sourceType}
            locked={locked}
          />
        ))}
      </div>
    </div>
  );
}
