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
type GameStatus = "idle" | "ready" | "playing" | "correct" | "tree" | "safety" | "wrong" | "won" | "retired";

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
  const [revealMsg, setRevealMsg] = useState("");
  const [showCorrect, setShowCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [treeLevel, setTreeLevel] = useState(-1);
  const [treeReady, setTreeReady] = useState(false);
  const [timer, setTimer] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/trivia")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  const submitScore = useCallback(async (level: number) => {
    if (level > 0) {
      try {
        await fetch("/api/trivia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: level }),
        });
      } catch {}
    }
    try {
      const r = await fetch("/api/trivia");
      if (r.ok) {
        const d = await r.json();
        setLeaderboard(d.leaderboard);
      }
    } catch {}
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
    setRevealMsg("");
    setShowCorrect(false);
    setScore(0);
    setStatus("ready");
  }, []);

  const q = questions[current];

  const handleRetire = () => {
    if (status !== "tree" || !treeReady) return;
    const level = current + 1;
    setScore(level);
    submitScore(level);
    setStatus("retired");
  };

  const handleContinue = () => {
    if (status !== "tree" || !treeReady) return;
    const hitSafety = SAFETY_NETS.includes(current);
    if (hitSafety) {
      setStatus("safety");
      setTimeout(() => {
        setCurrent((c) => c + 1);
        setSelected(null);
        setConfirmed(false);
        setEliminated(new Set());
        setHinchadaPcts(null);
        setShowHint(false);
        setStatus("playing");
      }, 2500);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
      setEliminated(new Set());
      setHinchadaPcts(null);
      setShowHint(false);
      setStatus("playing");
    }
  };

  const getTimeLimit = () => current < 6 ? 5 : current < 11 ? 10 : 15;

  // Timer: start on playing, stop on confirm/status change
  useEffect(() => {
    if (status === "playing" && !confirmed) {
      const limit = current < 6 ? 5 : current < 11 ? 10 : 15;
      setTimer(limit);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [status, confirmed, current]);

  // Time's up = auto-confirm selection or auto-lose
  useEffect(() => {
    if (timer === 0 && status === "playing" && !confirmed && questions.length > 0) {
      if (selected !== null) {
        handleConfirm();
      } else {
        setConfirmed(true);
        const safetyLevel = [...SAFETY_NETS].reverse().find((s) => s < current) ?? -1;
        const finalScore = safetyLevel + 1;
        setScore(finalScore);
        setRevealMsg("¡Se acabó el tiempo!");
        setTimeout(() => {
          setShowCorrect(true);
          setRevealMsg(`${optionLetter[q.answer]}: ${q.options[q.answer]}`);
        }, 1500);
        setTimeout(() => {
          setRevealMsg("");
          setStatus("wrong");
          submitScore(finalScore);
        }, 3500);
      }
    }
  }, [timer, status, confirmed]);

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
          setTreeLevel(Math.max(0, current - 1));
          setTreeReady(false);
          setStatus("tree");
          setTimeout(() => {
            setTreeLevel(current);
            setTimeout(() => setTreeReady(true), 1500);
          }, 1000);
        }, 1000);
      }
    } else {
      const safetyLevel = [...SAFETY_NETS].reverse().find((s) => s < current) ?? -1;
      const finalScore = safetyLevel + 1;
      setScore(finalScore);
      setRevealMsg("La respuesta correcta es...");
      setTimeout(() => {
        setShowCorrect(true);
        setRevealMsg(`${optionLetter[q.answer]}: ${q.options[q.answer]}`);
      }, 1500);
      setTimeout(() => {
        setRevealMsg("");
        setStatus("wrong");
        submitScore(finalScore);
      }, 3500);
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
    const wrongIdxs = [0, 1, 2, 3].filter((i) => i !== q.answer && !eliminated.has(i));

    // Harder questions = less reliable audience
    // Easy (0-5): 85% chance audience picks right, Medium (6-10): 65%, Hard (11-14): 45%
    const reliability = current < 6 ? 0.85 : current < 11 ? 0.65 : 0.45;
    const audienceRight = Math.random() < reliability;

    if (audienceRight) {
      // Correct answer gets plurality but not dominant — close second
      pcts[q.answer] = 30 + Math.floor(Math.random() * 15);
      const topWrong = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
      pcts[topWrong] = pcts[q.answer] - (3 + Math.floor(Math.random() * 10));
    } else {
      // Audience gets it wrong — a wrong answer leads
      const topWrong = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
      pcts[topWrong] = 30 + Math.floor(Math.random() * 15);
      pcts[q.answer] = pcts[topWrong] - (3 + Math.floor(Math.random() * 10));
    }

    // Distribute remaining among the rest
    let remaining = 100 - pcts.reduce((s, v) => s + v, 0);
    const restIdxs = [0, 1, 2, 3].filter((i) => pcts[i] === 0 && !eliminated.has(i));
    for (let i = 0; i < restIdxs.length; i++) {
      if (i === restIdxs.length - 1) {
        pcts[restIdxs[i]] = Math.max(2, remaining);
      } else {
        const share = Math.max(2, Math.floor(remaining / (restIdxs.length - i)) + Math.floor((Math.random() - 0.5) * 8));
        pcts[restIdxs[i]] = share;
        remaining -= share;
      }
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
    const base = "border border-cyan-500/30 bg-gradient-to-b from-[#1a1a4e] via-[#0d0d35] to-[#1a1a4e]";
    if (eliminated.has(idx)) return base + " opacity-20 pointer-events-none";
    if (confirmed) {
      if (idx === q?.answer && (showCorrect || selected === q?.answer)) return "border-2 border-emerald-400 bg-gradient-to-b from-emerald-900/60 via-emerald-950/80 to-emerald-900/60 shadow-lg shadow-emerald-500/30";
      if (idx === selected && idx !== q?.answer) return "border-2 border-red-400 bg-gradient-to-b from-red-900/60 via-red-950/80 to-red-900/60 shadow-lg shadow-red-500/30";
    }
    if (idx === selected) return "border-2 border-amber-400 bg-gradient-to-b from-amber-900/40 via-[#1a1a4e] to-amber-900/40 shadow-lg shadow-amber-500/20";
    return base + " hover:border-cyan-400/50 hover:shadow-md hover:shadow-cyan-500/10";
  };

  return (
    <div className="mx-auto max-w-lg pb-20">
      {status === "idle" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-3xl text-foreground text-center">¿QUIÉN QUIERE GANAR EL MUNDIAL?</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            15 preguntas de historia mundialista. Llegá lo más lejos que puedas. Tenés 3 comodines y 2 clasificaciones aseguradas.
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

      {status === "ready" && (
        <div
          className="relative rounded-2xl ring-1 ring-indigo-500/20 overflow-hidden mb-16 h-[480px] cursor-pointer"
          style={{ backgroundImage: "url(/images/bg_millionaire.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
          onClick={() => setStatus("playing")}
        >
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-5">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-bebas)" }}>PREGUNTA 1</p>
            <p className="text-lg text-amber-400" style={{ fontFamily: "var(--font-bebas)" }}>{PRIZE_LADDER[0].stage} — {PRIZE_LADDER[0].money}</p>
            <p className="text-sm text-white/60 animate-pulse">Tocá cuando estés listo</p>
          </div>
        </div>
      )}

      {(status === "tree" || status === "safety" || status === "playing" || status === "correct") && (
        <div
          className={`relative rounded-2xl overflow-hidden mb-16 h-[480px] transition-all duration-300 ${
            timer <= 3 && timer > 0 && status === "playing" && !confirmed
              ? "ring-2 ring-red-500/60 shadow-lg shadow-red-500/20"
              : "ring-1 ring-indigo-500/20"
          }`}
          style={{ backgroundImage: "url(/images/bg_millionaire.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/75" />

          {/* MONEY TREE */}
          {status === "tree" && (
            <div className="relative z-10 flex flex-col items-center justify-center px-4 py-2 h-full">
              {/* Lifeline circles */}

              {/* Ladder */}
              <div className="w-full max-w-xs flex flex-col gap-0">
                {[...PRIZE_LADDER].reverse().map((prize, revIdx) => {
                  const idx = 14 - revIdx;
                  const isCurrent = idx === treeLevel;
                  const isPassed = idx < treeLevel;
                  const isNext = idx === treeLevel + 1;
                  const isSafety = SAFETY_NETS.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-full px-4 py-1 transition-all duration-700 ${
                        isNext
                          ? "bg-amber-500/30 ring-1 ring-amber-400/50 scale-[1.03]"
                          : isCurrent
                            ? "bg-emerald-500/20 ring-1 ring-emerald-400/30"
                            : "bg-white/[0.02]"
                      }`}
                    >
                      <span style={{ fontFamily: "var(--font-bebas)" }} className={`w-5 text-right text-sm ${
                        isNext ? "text-white font-bold" : isPassed ? "text-emerald-400" : isSafety ? "text-white" : "text-amber-500/60"
                      }`}>
                        {idx + 1}
                      </span>
                      <span style={{ fontFamily: "var(--font-bebas)" }} className={`flex-1 text-sm tracking-wider ${
                        isNext
                          ? "text-white font-bold"
                          : isCurrent
                            ? "text-emerald-400 font-bold"
                            : isPassed
                              ? "text-emerald-400/50"
                              : isSafety
                                ? "text-white"
                                : "text-amber-500/60"
                      }`}>
                        {prize.stage}
                      </span>
                      <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-sm tracking-wider ${
                        isNext
                          ? "text-amber-300 font-bold"
                          : isCurrent
                            ? "text-emerald-400"
                            : isPassed
                              ? "text-emerald-400/50"
                              : isSafety
                                ? "text-amber-400"
                                : "text-amber-500/40"
                      }`}>
                        {prize.money}
                      </span>
                      {isNext && <span className="text-amber-400 text-xs animate-pulse">◀</span>}
                      {isCurrent && <span className="text-emerald-400 text-xs">✓</span>}
                    </div>
                  );
                })}
              </div>

              {/* Continue / Retire overlay */}
              {treeReady && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm rounded-2xl">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Alcanzaste</p>
                  <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-bebas)" }}>{PRIZE_LADDER[current].stage}</p>
                  <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-bebas)" }}>{PRIZE_LADDER[current].money}</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest">¿Seguís o te retirás?</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-2.5 font-display text-sm uppercase tracking-wider text-black shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
                    >
                      Continuar
                    </button>
                    <button
                      type="button"
                      onClick={handleRetire}
                      className="rounded-full bg-white/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70 ring-1 ring-white/20 transition-all hover:bg-white/20 hover:text-white"
                    >
                      Retirarse
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAFETY NET CELEBRATION */}
          {status === "safety" && (
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 px-4">
              <span className="text-6xl">✅</span>
              <h3 className="font-display text-2xl uppercase tracking-wider text-amber-400">
                {current === 5 ? "¡Clasificaste al mundial!" : "¡Pasaste la fase de grupos!"}
              </h3>
              <p className="text-center text-sm text-white/70">
                {current === 5
                  ? "Llegaste a la fase de grupos — tu progreso está asegurado"
                  : "Entraste al knockout — no podés bajar de acá"}
              </p>
              <span className="font-display text-lg text-emerald-400" style={{ fontFamily: "var(--font-bebas)" }}>
                ✅ {PRIZE_LADDER[current].stage} — {PRIZE_LADDER[current].money}
              </span>
            </div>
          )}

          {/* QUESTION VIEW */}
          {(status === "playing" || status === "correct") && q && (
            <div className="relative z-10 flex flex-col gap-3 px-3 py-4 pb-5" >
          {/* Lifelines bar */}
          <div className="relative z-10 flex items-center justify-between px-1 pt-2">
            <div className="flex gap-2">
              {([["var", "🖥️", "VAR"], ["hinchada", "👥", "Hinchada"], ["dt", "📞", "DT"]] as const).map(([key, emoji, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={key === "var" ? useVar : key === "hinchada" ? useHinchada : useDt}
                  disabled={usedLifelines.has(key) || confirmed}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] transition-all ${
                    usedLifelines.has(key)
                      ? "opacity-25 bg-white/5"
                      : "bg-indigo-500/20 hover:bg-indigo-500/30 ring-1 ring-indigo-400/30"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-indigo-200">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current prize level + timer */}
          <div className="relative z-10 flex items-center justify-between px-2 py-1">
            <span className="rounded-full bg-amber-500/20 px-4 py-1 text-sm font-bold text-amber-300 ring-1 ring-amber-400/30 tracking-wider" style={{ fontFamily: "var(--font-bebas)" }}>
              {current + 1} — {PRIZE_LADDER[current].stage}
            </span>
            {!confirmed && timer > 0 && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold tracking-wider ${
                timer <= 3 ? "bg-red-500/30 text-red-400 ring-1 ring-red-400/50 animate-pulse" : "bg-white/10 text-white/70 ring-1 ring-white/20"
              }`} style={{ fontFamily: "var(--font-bebas)" }}>
                {timer}s
              </span>
            )}
          </div>

          {/* Question bar — hexagonal with extending lines */}
          <div className="relative z-10 flex items-center mx-0 my-2">
            <div className="absolute left-0 w-[8%] top-1/2 h-[1px] bg-gradient-to-r from-cyan-500/20 to-cyan-500/50" />
            <div className="absolute right-0 w-[8%] top-1/2 h-[1px] bg-gradient-to-l from-cyan-500/20 to-cyan-500/50" />
            <div
              className="relative z-10 mx-auto w-[86%] bg-gradient-to-b from-[#1e2a5e] via-[#0c1030] to-[#1e2a5e] px-6 py-4 shadow-lg shadow-cyan-900/30 border-t border-b border-cyan-500/20"
              style={{ clipPath: "polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)" }}
            >
              <p className="text-center text-sm font-medium text-white leading-relaxed">{q.q}</p>
            </div>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="relative z-10 mx-2 rounded-xl bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300 ring-1 ring-amber-500/20">
              📞 DT dice: &ldquo;{q.hint}&rdquo;
            </div>
          )}

          {/* Hinchada percentages */}
          {hinchadaPcts && (
            <div className="relative z-10 flex gap-2 px-2">
              {hinchadaPcts.map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-14 bg-indigo-950/50 rounded-lg relative overflow-hidden ring-1 ring-indigo-500/20">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500/50 to-indigo-400/20 transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-[9px] font-bold text-indigo-200">{pct}%</span>
                  </div>
                  <span className="text-[9px] text-indigo-400/60">{optionLetter[i]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Options — 2x2 hexagonal bars with extending lines */}
          <div className="relative z-10 mx-0 flex flex-col gap-2 my-2">
            {[0, 2].map((rowStart) => (
              <div key={rowStart} className="relative flex items-center">
                <div className="absolute left-0 w-[5%] top-1/2 h-[1px] bg-gradient-to-r from-cyan-500/20 to-cyan-500/40" />
                <div className="absolute right-0 w-[5%] top-1/2 h-[1px] bg-gradient-to-l from-cyan-500/20 to-cyan-500/40" />
                <div className="flex w-full gap-1 px-[5%]">
                  {[rowStart, rowStart + 1].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      disabled={eliminated.has(idx) || confirmed}
                      className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-left transition-all duration-200 ${getOptionStyle(idx)}`}
                      style={{ clipPath: "polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)" }}
                    >
                      <span className="flex-shrink-0 text-xs font-bold font-display text-amber-400">{optionLetter[idx]}:
                      </span>
                      <span className="text-xs text-white/90 leading-tight">{q.options[idx]}</span>
                      {hinchadaPcts && !eliminated.has(idx) && (
                        <span className="ml-auto text-[9px] font-bold text-indigo-300 flex-shrink-0">{hinchadaPcts[idx]}%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Confirm button */}
          {selected !== null && !confirmed && (
            <button
              type="button"
              onClick={handleConfirm}
              className="relative z-10 mx-auto rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-2.5 font-display text-sm uppercase tracking-wider text-black shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
            >
              Confirmar
            </button>
          )}

          {revealMsg && (
            <div className="relative z-10 mx-auto text-center">
              <p className="text-sm font-medium text-amber-300 italic animate-pulse">{revealMsg}</p>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {status === "retired" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">🤝</span>
          <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-gold">¡Te retiraste!</h3>
          <p className="text-sm text-fifa-dark-gray">Decisión inteligente. Te llevás:</p>
          <p className="font-display text-3xl text-fifa-gold">{score > 0 ? PRIZE_LADDER[score - 1]?.stage : "Nada"}</p>
          <button type="button" onClick={start} className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white">
            Jugar de nuevo
          </button>
        </div>
      )}

      {status === "wrong" && q && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">😩</span>
          <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">¡Eliminado!</h3>
          {score > 0 ? (
            <div className="text-center">
              <p className="text-xs text-fifa-dark-gray">Te llevás:</p>
              <p className="font-display text-2xl text-fifa-gold">{PRIZE_LADDER[score - 1]?.stage}</p>
            </div>
          ) : (
            <p className="text-xs text-fifa-dark-gray">No alcanzaste ninguna clasificación asegurada</p>
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
          <p className="font-display text-3xl text-fifa-gold">{PRIZE_LADDER[14].stage}</p>
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
                <div className="text-right flex-shrink-0">
                  <span className="font-display text-sm text-fifa-gold">{PRIZE_LADDER[entry.score - 1]?.money || "—"}</span>
                  <p className="text-[8px] text-fifa-dark-gray">{PRIZE_LADDER[entry.score - 1]?.stage}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
