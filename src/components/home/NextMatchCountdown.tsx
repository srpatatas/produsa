"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UnifiedMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { getNextUnifiedMatch } from "@/lib/unifiedMatches";
import { FlagImage } from "@/components/teams/FlagImage";
import { usePlanilla } from "@/context/PlanillaContext";
import { getComodinConfig } from "@/data/comodinConfig";
import { outcomeConfig } from "@/lib/outcomeStyles";
import { MatchPredictionsDropdown } from "./MatchPredictionsDropdown";

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

export function NextMatchCountdown() {
  const [match, setMatch] = useState<UnifiedMatch | undefined>();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ready, setReady] = useState(false);
  const [comodines, setComodines] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { predictions } = usePlanilla();

  useEffect(() => {
    const next = getNextUnifiedMatch();
    setMatch(next);
    if (next) setTimeLeft(getTimeLeft(next.kickoff));
    setReady(true);

    fetch("/api/comodines")
      .then((r) => r.ok ? r.json() : { comodines: {} })
      .then((data) => setComodines(data.comodines))
      .catch(() => {});

    fetch("/api/locks")
      .then((r) => r.ok ? r.json() : { locks: {} })
      .then((data) => {
        if (next) {
          const lock = data.locks?.[next.scope];
          setIsLocked(lock?.isLocked ?? false);
        }
      })
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

  const home = match.homeTeamId ? getTeam(match.homeTeamId) : null;
  const away = match.awayTeamId ? getTeam(match.awayTeamId) : null;
  const prediction = predictions[match.id];
  const hasPrediction = !!prediction;
  const comodinScope = match.scope;
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
            {home ? (
              <>
                <FlagImage code={home.flagCode} name={home.name} size="xl" />
                <span className="font-display text-lg tracking-wider text-foreground">
                  {home.shortName}
                </span>
              </>
            ) : (
              <span className="text-sm text-fifa-dark-gray">{match.homeLabel}</span>
            )}
          </div>

          <div className="px-4 text-center">
            <span className="text-xs font-medium text-fifa-dark-gray">vs</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {away ? (
              <>
                <FlagImage code={away.flagCode} name={away.name} size="xl" />
                <span className="font-display text-lg tracking-wider text-foreground">
                  {away.shortName}
                </span>
              </>
            ) : (
              <span className="text-sm text-fifa-dark-gray">{match.awayLabel}</span>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-4 sm:gap-6">
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
                    <Image src={getComodinConfig(comodinScope).image} alt="Comodín" fill className="object-cover" />
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
          <p>{new Date(match.kickoff).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })} · {new Date(match.kickoff).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })}h</p>
          <p>{match.venue}, {match.city}</p>
        </div>

      </div>

      <div className="border-t border-white/5 px-5 py-4">
        <p className="mb-3 text-center text-[11px] italic text-fifa-dark-gray/70">
          Falta mucho para el próximo partido? Matá el tiempo jugando
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          <Link href="/panic" className="group flex flex-col items-center gap-1.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-fifa-purple via-fifa-blue to-fifa-teal shadow-md shadow-fifa-purple/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
              <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">😱</span>
            </div>
            <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Produsa Panic</span>
          </Link>
          {Date.now() >= Date.UTC(2026, 5, 13, 14, 0, 0) && (
            <Link href="/prod-man" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-fifa-gold via-amber-500 to-yellow-500 shadow-md shadow-fifa-gold/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">👻</span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Prod-Man</span>
            </Link>
          )}
          {Date.now() >= Date.UTC(2026, 5, 14, 12, 0, 0) && (
            <Link href="/viborusa" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-md shadow-emerald-500/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">🐍</span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Viborusa</span>
            </Link>
          )}
          {Date.now() >= Date.UTC(2026, 5, 15, 7, 0, 0) && (
            <Link href="/produtris" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-md shadow-indigo-500/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">🧱</span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Produtris</span>
            </Link>
          )}
          {Date.now() >= Date.UTC(2026, 5, 16, 7, 0, 0) && (
            <Link href="/arkanusa" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-md shadow-cyan-500/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">🏓</span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Arkanusa</span>
            </Link>
          )}
          {Date.now() >= Date.UTC(2026, 5, 17, 7, 0, 0) && (
            <Link href="/invaders" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 shadow-md shadow-red-500/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="text-2xl transition-transform duration-200 group-hover:-rotate-6">👾</span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>FIFA Invaders</span>
            </Link>
          )}
          {Date.now() >= Date.UTC(2026, 5, 18, 7, 0, 0) && (
            <Link href="/flappy" className="group flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-pink-500 via-rose-400 to-fuchsia-400 shadow-md shadow-pink-500/30 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
                <span className="relative text-2xl transition-transform duration-200 group-hover:-rotate-6">
                  <span className="absolute -left-2 -top-0.5 h-3.5 w-[2px] -rotate-[35deg] rounded-full bg-white/50" />
                  <span className="absolute -left-3.5 top-0 h-3 w-[2px] -rotate-[35deg] rounded-full bg-white/35" />
                  <span className="absolute -left-5 top-0.5 h-2.5 w-[2px] -rotate-[35deg] rounded-full bg-white/20" />
                  ⚽
                </span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-fifa-dark-gray" style={{ fontFamily: "var(--font-playful)" }}>Flappy Trionda</span>
            </Link>
          )}
        </div>
      </div>

      {isLocked && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-2 border-t border-white/5 px-4 py-2.5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
              Predicciones
            </span>
            <svg
              className={`h-3.5 w-3.5 text-fifa-dark-gray/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && <MatchPredictionsDropdown matchId={match.id} />}
        </div>
      )}
    </div>
  );
}
