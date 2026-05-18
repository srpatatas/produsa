"use client";

import { useState, useEffect } from "react";
import { teams } from "@/data/teams";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

interface BonusQuestion {
  id: string;
  label: string;
  subtitle?: string;
  points?: number;
  sourceType: string;
  lockScope: string;
}

const teamOptions = Object.values(teams)
  .map((t) => ({ value: t.id, label: t.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const participantOptions = [
  "Fede", "Nico", "Mati", "Sofi", "Juanchi", "Caro", "Tincho", "Player 1",
].map((name) => ({ value: name, label: name }));

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative group">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onBlur={() => setShow(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-white/5 text-[8px] italic font-bold text-fifa-dark-gray hover:bg-white/10 hover:text-foreground transition-colors"
      >
        i
      </button>
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-52 rounded-lg bg-card-bg px-3 py-2 text-[10px] text-foreground shadow-xl ring-1 ring-white/10 normal-case tracking-normal font-normal transition-opacity duration-150 pointer-events-none",
        show ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100",
      )}>
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 bg-card-bg ring-1 ring-white/10" />
      </div>
    </span>
  );
}

function BonusSelect({
  questionId,
  label,
  subtitle,
  points,
  sourceType,
  locked,
}: {
  questionId: string;
  label: string;
  subtitle?: string;
  points?: number;
  sourceType: string;
  locked?: boolean;
}) {
  const { bonusPredictions, setBonusPrediction, removeBonusPrediction } = usePlanilla();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const value = bonusPredictions[questionId] ?? "";
  const [localText, setLocalText] = useState(value);

  useEffect(() => {
    setLocalText(value);
  }, [value]);

  const saveTextInput = () => {
    const trimmed = localText.trim();
    if (trimmed === value) return;
    if (trimmed) {
      setBonusPrediction(questionId, trimmed);
    } else if (value) {
      removeBonusPrediction(questionId);
    }
  };

  const options =
    sourceType === "teams"
      ? teamOptions
      : sourceType === "participants"
        ? participantOptions
        : [];

  const isTextInput = sourceType === "players" || sourceType === "exact_value";
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  if (isTextInput) {
    return (
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
          {label}
          {subtitle && <InfoTooltip text={subtitle} />}
          {!!points && <span className="rounded-full bg-fifa-gold/20 px-1.5 py-0.5 text-[8px] font-bold text-fifa-gold normal-case tracking-normal">+{points}</span>}
        </label>
        <input
          type={sourceType === "exact_value" ? "number" : "text"}
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={saveTextInput}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder={sourceType === "exact_value" ? "Ingresá un número" : "Escribí tu predicción"}
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
      <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
        {label}
        {subtitle && <InfoTooltip text={subtitle} />}
        {!!points && <span className="rounded-full bg-fifa-gold/20 px-1.5 py-0.5 text-[8px] font-bold text-fifa-gold normal-case tracking-normal">+{points}</span>}
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
        <span className="flex items-center gap-1">
          {value && !locked && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); removeBonusPrediction(questionId); }}
              className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-fifa-dark-gray/40 hover:bg-white/10 hover:text-foreground"
            >
              ✕
            </span>
          )}
          <span className="text-sm text-fifa-dark-gray/40">▾</span>
        </span>
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

export function BonusPredictions({ locked, scope }: { locked?: boolean; scope?: string }) {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);

  useEffect(() => {
    fetch("/api/bonus-questions")
      .then((r) => r.ok ? r.json() : { questions: [] })
      .then((data) => setQuestions(data.questions))
      .catch(() => {});
  }, []);

  const filtered = scope ? questions.filter((q) => q.lockScope === scope) : questions;
  if (filtered.length === 0) return null;

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
        {filtered.map((q) => (
          <BonusSelect
            key={q.id}
            questionId={q.id}
            label={q.label}
            subtitle={q.subtitle}
            points={q.points}
            sourceType={q.sourceType}
            locked={locked}
          />
        ))}
      </div>
    </div>
  );
}
