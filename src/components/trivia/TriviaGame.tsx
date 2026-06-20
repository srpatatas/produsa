"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { getQuestions, PRIZE_LADDER, SAFETY_NETS, type Question } from "./questions";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

type Lifeline = "var" | "hinchada" | "dt";
type GameStatus = "idle" | "playing" | "correct" | "wrong" | "won";

export function TriviaGame() {
  const user = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [usedLifelines, setUsedLifelines] = useState<Set<Lifeline>>(new Set());
  const [eliminated, setEliminated] = useState<Set<number>>(new Set());
  const [hinchadaPcts, setHinchadaPcts] = useState<number[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch("/api/trivia")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  const submitScore = useCallback((level: number) => {
    if (level > 0) {
      fetch("/api/trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: level }),
      }).catch(() => {});
    }
    fetch("/api/trivia")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  const start = useCallback(() => {
    setQuestions(getQuestions());
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setUsedLifelines(new Set());
    setEliminated(new Set());
    setHinchadaPcts(null);
    setShowHint(false);
    setScore(0);
    setStatus("playing");
  }, []);

  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (status !== "playing" || confirmed || eliminated.has(idx)) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null || !q || confirmed) return;
    setConfirmed(true);

    if (selected === q.answer) {
      const newScore = current + 1;
      setScore(newScore);

      if (current === 14) {
        setStatus("won");
        submitScore(newScore);
      } else {
        setStatus("correct");
        setTimeout(() => {
          setCurrent((c) => c + 1);
          setSelected(null);
          setConfirmed(false);
          setEliminated(new Set());
          setHinchadaPcts(null);
          setShowHint(false);
          setStatus("playing");
        }, 1500);
      }
    } else {
      const safetyLevel = [...SAFETY_NETS].reverse().find((s) => s < current) ?? -1;
      const finalScore = safetyLevel + 1;
      setScore(finalScore);
      setStatus("wrong");
      submitScore(finalScore);
    }
  };

  const useVar = () => {
    if (usedLifelines.has("var") || !q || confirmed) return;
    setUsedLifelines((s) => new Set([...s, "var"]));
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer);
    const toRemove = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(new Set(toRemove));
    if (selected !== null && toRemove.includes(selected)) setSelected(null);
  };

  const useHinchada = () => {
    if (usedLifelines.has("hinchada") || !q || confirmed) return;
    setUsedLifelines((s) => new Set([...s, "hinchada"]));
    const pcts = [0, 0, 0, 0];
    pcts[q.answer] = 40 + Math.floor(Math.random() * 30);
    let remaining = 100 - pcts[q.answer];
    for (let i = 0; i < 4; i++) {
      if (i === q.answer) continue;
      if (eliminated.has(i)) continue;
      const share = i === 3 ? remaining : Math.floor(Math.random() * remaining * 0.6);
      pcts[i] = share;
      remaining -= share;
    }
    const nonEliminated = [0, 1, 2, 3].filter((i) => !eliminated.has(i) && i !== q.answer);
    if (remaining > 0 && nonEliminated.length > 0) {
      pcts[nonEliminated[nonEliminated.length - 1]] += remaining;
    }
    setHinchadaPcts(pcts);
  };

  const useDt = () => {
    if (usedLifelines.has("dt") || !q || confirmed) return;
    setUsedLifelines((s) => new Set([...s, "dt"]));
    setShowHint(true);
  };

  const optionLetter = ["A", "B", "C", "D"];

  const getOptionStyle = (idx: number) => {
    if (eliminated.has(idx)) return "opacity-30 pointer-events-none";
    if (confirmed) {
      if (idx === q?.answer) return "ring-2 ring-emerald-400 bg-emerald-500/20";
      if (idx === selected && idx !== q?.answer) return "ring-2 ring-red-400 bg-red-500/20";
    }
    if (idx === selected) return "ring-2 ring-fifa-blue bg-fifa-blue/20";
    return "bg-white/[0.03] hover:bg-white/[0.06]";
  };

  return (
    <div className="mx-auto max-w-lg">
      {status === "idle" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-3xl text-foreground text-center">¿QUIÉN QUIERE GANAR EL MUNDIAL?</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            15 preguntas de historia mundialista. Llegá lo más lejos que puedas. Tenés 3 comodines y 2 redes de seguridad.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>🖥️ VAR <span className="text-fifa-gold">(50/50)</span></span>
            <span>👥 Hinchada <span className="text-fifa-gold">(%)</span></span>
            <span>📞 DT <span className="text-fifa-gold">(pista)</span></span>
          </div>
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-gradient-to-r from-fifa-purple via-fifa-blue to-fifa-teal px-8 py-3 font-display text-lg uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/30 transition-transform hover:scale-105"
          >
            Empezar
          </button>
        </div>
      )}

      {(status === "playing" || status === "correct") && q && (
        <div className="flex flex-col gap-4 py-4">
          {/* Prize ladder mini */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Pregunta {current + 1}/15</span>
            <span className="font-display text-sm text-fifa-gold">{PRIZE_LADDER[current]}</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fifa-purple to-fifa-teal transition-all duration-500"
              style={{ width: `${((current + 1) / 15) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="rounded-2xl bg-card-bg p-5 ring-1 ring-white/5">
            <p className="text-center text-sm font-medium text-foreground leading-relaxed">{q.q}</p>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="rounded-xl bg-fifa-gold/10 px-4 py-2 text-center text-xs text-fifa-gold ring-1 ring-fifa-gold/20">
              📞 DT dice: &quot;{q.hint}&quot;
            </div>
          )}

          {/* Hinchada percentages */}
          {hinchadaPcts && (
            <div className="flex gap-1.5 px-2">
              {hinchadaPcts.map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-16 bg-white/5 rounded relative overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-fifa-blue/40 transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-fifa-dark-gray">{pct}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={eliminated.has(idx) || confirmed}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${getOptionStyle(idx)}`}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-xs text-fifa-dark-gray">
                  {optionLetter[idx]}
                </span>
                <span className="text-sm text-foreground">{opt}</span>
                {hinchadaPcts && !eliminated.has(idx) && (
                  <span className="ml-auto text-[10px] text-fifa-dark-gray">{hinchadaPcts[idx]}%</span>
                )}
              </button>
            ))}
          </div>

          {/* Confirm button */}
          {selected !== null && !confirmed && (
            <button
              type="button"
              onClick={handleConfirm}
              className="mx-auto rounded-full bg-fifa-blue px-8 py-2.5 font-display text-sm uppercase tracking-wider text-white transition-transform hover:scale-105"
            >
              Confirmar
            </button>
          )}

          {/* Lifelines */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={useVar}
              disabled={usedLifelines.has("var") || confirmed}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${usedLifelines.has("var") ? "opacity-30" : "bg-white/[0.03] hover:bg-white/[0.06]"}`}
            >
              <span className="text-lg">🖥️</span>
              <span className="text-[9px] text-fifa-dark-gray">VAR</span>
            </button>
            <button
              type="button"
              onClick={useHinchada}
              disabled={usedLifelines.has("hinchada") || confirmed}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${usedLifelines.has("hinchada") ? "opacity-30" : "bg-white/[0.03] hover:bg-white/[0.06]"}`}
            >
              <span className="text-lg">👥</span>
              <span className="text-[9px] text-fifa-dark-gray">Hinchada</span>
            </button>
            <button
              type="button"
              onClick={useDt}
              disabled={usedLifelines.has("dt") || confirmed}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${usedLifelines.has("dt") ? "opacity-30" : "bg-white/[0.03] hover:bg-white/[0.06]"}`}
            >
              <span className="text-lg">📞</span>
              <span className="text-[9px] text-fifa-dark-gray">DT</span>
            </button>
          </div>

          {/* Safety net indicators */}
          <div className="flex justify-center gap-2 text-[9px] text-fifa-dark-gray">
            {SAFETY_NETS.map((s) => (
              <span key={s} className={current > s ? "text-emerald-400" : ""}>
                🛡️ {PRIZE_LADDER[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === "wrong" && q && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">😩</span>
          <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">¡Eliminado!</h3>
          <p className="text-sm text-fifa-dark-gray">
            La respuesta correcta era: <span className="text-foreground font-medium">{q.options[q.answer]}</span>
          </p>
          {score > 0 ? (
            <div className="text-center">
              <p className="text-xs text-fifa-dark-gray">Te llevás:</p>
              <p className="font-display text-2xl text-fifa-gold">{PRIZE_LADDER[score - 1]}</p>
            </div>
          ) : (
            <p className="text-xs text-fifa-dark-gray">No alcanzaste ninguna red de seguridad</p>
          )}
          <button type="button" onClick={start} className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white">
            Jugar de nuevo
          </button>
        </div>
      )}

      {status === "won" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">🏆</span>
          <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-gold">¡GANASTE EL MUNDIAL!</h3>
          <p className="font-display text-3xl text-fifa-gold">{PRIZE_LADDER[14]}</p>
          <p className="text-xs text-emerald-400">15/15 — Perfecto</p>
          <button type="button" onClick={start} className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white">
            Jugar de nuevo
          </button>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 ¿Quién quiere ganar el mundial?
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-center text-xs text-fifa-dark-gray/50 py-2">
            Nadie jugó todavía. ¡Sé el primero!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                  entry.userId === user.id ? "bg-fifa-blue/10 ring-1 ring-fifa-blue/20" : "bg-white/[0.02]"
                }`}
              >
                <span className="w-5 text-center font-display text-sm text-fifa-dark-gray">
                  {entry.position === 1 ? "🥇" : entry.position}
                </span>
                <AvatarDisplay avatar={entry.avatar} size="sm" />
                <span className="flex-1 text-xs font-medium text-foreground truncate">
                  {entry.name}
                </span>
                <span className="font-display text-sm text-fifa-gold">{PRIZE_LADDER[entry.score - 1] || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
