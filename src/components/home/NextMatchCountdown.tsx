"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { getNextMatch } from "@/data/matches";
import { FlagImage } from "@/components/teams/FlagImage";
import { usePlanilla } from "@/context/PlanillaContext";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(kickoff: string): TimeLeft {
  const diff = Math.max(0, new Date(kickoff).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl text-foreground sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-fifa-dark-gray">
        {label}
      </span>
    </div>
  );
}

const outcomeConfig: Record<string, { label: string; bg: string }> = {
  L: { label: "LOCAL", bg: "bg-fifa-green" },
  E: { label: "EMPATE", bg: "bg-fifa-blue" },
  V: { label: "VISITANTE", bg: "bg-fifa-red" },
  LE: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-fifa-green to-fifa-blue" },
  EL: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-fifa-green to-fifa-blue" },
  EV: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-fifa-blue to-fifa-red" },
  VE: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-fifa-blue to-fifa-red" },
  LV: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-fifa-green to-fifa-red" },
  VL: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-fifa-green to-fifa-red" },
};

export function NextMatchCountdown() {
  const [match, setMatch] = useState<Match | undefined>();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ready, setReady] = useState(false);
  const [comodines, setComodines] = useState<Record<string, string>>({});
  const { predictions } = usePlanilla();

  useEffect(() => {
    const next = getNextMatch();
    setMatch(next);
    if (next) setTimeLeft(getTimeLeft(next.kickoff));
    setReady(true);

    fetch("/api/comodines")
      .then((r) => r.ok ? r.json() : { comodines: {} })
      .then((data) => setComodines(data.comodines))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!match) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(match.kickoff));
    }, 1000);
    return () => clearInterval(interval);
  }, [match]);

  if (!ready || !match) return null;

  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const prediction = predictions[match.id];
  const hasPrediction = !!prediction;
  const comodinScope = `fecha-${match.matchday}`;
  const hasComodin = comodines[comodinScope] === match.id;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5 overflow-hidden">
      <div className="bg-gradient-to-r from-fifa-purple/20 via-fifa-blue/20 to-fifa-teal/20 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          Próximo partido
        </span>
      </div>

      <div className="p-5">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 flex-col items-center gap-2">
            <FlagImage code={home.flagCode} name={home.name} size="xl" />
            <span className="font-display text-lg tracking-wider text-foreground">
              {home.shortName}
            </span>
          </div>

          <div className="px-4 text-center">
            <span className="text-xs font-medium text-fifa-dark-gray">vs</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <FlagImage code={away.flagCode} name={away.name} size="xl" />
            <span className="font-display text-lg tracking-wider text-foreground">
              {away.shortName}
            </span>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-4 sm:gap-6">
          <CountdownUnit value={timeLeft.days} label="días" />
          <span className="font-display text-2xl text-fifa-dark-gray/30">:</span>
          <CountdownUnit value={timeLeft.hours} label="hs" />
          <span className="font-display text-2xl text-fifa-dark-gray/30">:</span>
          <CountdownUnit value={timeLeft.minutes} label="min" />
          <span className="font-display text-2xl text-fifa-dark-gray/30">:</span>
          <CountdownUnit value={timeLeft.seconds} label="seg" />
        </div>

        {hasPrediction && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
              Tu predicción
            </span>
            <div className="relative">
              <div className={`rounded-2xl px-6 py-3 shadow-lg ${outcomeConfig[prediction.outcome]?.bg || "bg-surface"}`}>
                <span className="font-display text-xl tracking-wider text-white">
                  {outcomeConfig[prediction.outcome]?.label || prediction.outcome}
                </span>
              </div>
              {hasComodin && (
                <>
                  <div className="absolute -left-2 -top-2 h-8 w-8 rounded-full overflow-hidden ring-2 ring-fifa-gold shadow-lg shadow-fifa-gold/20">
                    <Image src="/images/comodino.JPG" alt="Comodín" fill className="object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-fifa-gold px-1.5 py-0.5 text-[8px] font-bold text-black shadow-lg shadow-fifa-gold/30">
                    +2
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-[10px] text-fifa-dark-gray/50">
          {match.venue}, {match.city} · Grupo {match.groupId}
        </div>
      </div>
    </div>
  );
}
