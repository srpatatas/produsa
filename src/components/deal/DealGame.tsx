"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import {
  AMOUNTS, LOW_AMOUNTS, HIGH_AMOUNTS,
  BANKERS, getBankerMood, createPhraseTracker,
  formatMoney,
  type DealState,
} from "./gameTypes";
import { createInitialState, pickCase, openCase, acceptDeal, rejectDeal, revealFinal } from "./gameLogic";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

export function DealGame() {
  const user = useUser();
  const [state, setState] = useState<DealState>(createInitialState);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bankerIdx, setBankerIdx] = useState(() => Math.floor(Math.random() * BANKERS.length));
  const banker = BANKERS[bankerIdx];
  const pickPhrase = useRef(createPhraseTracker());
  const [bankerPhrase, setBankerPhrase] = useState("");
  const [revealedAmount, setRevealedAmount] = useState<number | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [phoneRinging, setPhoneRinging] = useState(false);
  const [bankerThinking, setBankerThinking] = useState(false);
  const [offerHistory, setOfferHistory] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [eliminatedAmount, setEliminatedAmount] = useState<number | null>(null);
  const [revealingPhase, setRevealingPhase] = useState(false);
  const [revealedCases, setRevealedCases] = useState<Set<number>>(new Set());
  const [revealMessage, setRevealMessage] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    fetch("/api/deal")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  const submitScore = useCallback(async (amount: number) => {
    try {
      await fetch("/api/deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: amount }),
      });
    } catch {}
    try {
      const r = await fetch("/api/deal");
      if (r.ok) {
        const d = await r.json();
        setLeaderboard(d.leaderboard);
      }
    } catch {}
  }, []);

  const start = useCallback(() => {
    setState(createInitialState());
    setBankerPhrase("");
    setRevealedAmount(null);
    setShowReveal(false);
    setSelectedCase(null);
    setPhoneRinging(false);
    setBankerThinking(false);
    setOfferHistory([]);
    setShowConfetti(false);
    setEliminatedAmount(null);
    setRevealingPhase(false);
    setRevealedCases(new Set());
    setRevealMessage(false);
    setShowSplash(false);
    setBankerIdx(Math.floor(Math.random() * BANKERS.length));
    pickPhrase.current = createPhraseTracker();
  }, []);

  const handleCaseClick = (idx: number) => {
    if (idx === state.playerCase || state.opened.has(idx)) return;
    setSelectedCase(idx);
  };

  const handleConfirmCase = () => {
    if (selectedCase === null) return;
    const idx = selectedCase;
    setSelectedCase(null);

    if (state.phase === "pick") {
      setState(pickCase(state, idx));
    } else if (state.phase === "opening") {
      const amount = state.cases[idx];
      setRevealedAmount(amount);
      setEliminatedAmount(amount);
      setShowReveal(true);
      setTimeout(() => setEliminatedAmount(null), 1500);
      setTimeout(() => {
        setShowReveal(false);
        setRevealedAmount(null);
        const next = openCase(state, idx);
        setState(next);
        if (next.phase === "offer") {
          // Phone ring → thinking → reveal offer
          setPhoneRinging(true);
          setTimeout(() => {
            setPhoneRinging(false);
            setBankerThinking(true);
            setTimeout(() => {
              setBankerThinking(false);
              const newHistory = [...offerHistory, next.offer];
              setOfferHistory(newHistory);
              const mood = getBankerMood(next, newHistory);
              setBankerPhrase(pickPhrase.current(banker.offer[mood]));
            }, 1500);
          }, 2000);
        }
      }, 1200);
    }
  };

  const handleDeal = () => {
    const mood = getBankerMood(state, offerHistory);
    setBankerPhrase(pickPhrase.current(banker.deal[mood]));
    const next = acceptDeal(state);
    setState(next);
    submitScore(next.finalAmount);
    if (next.finalAmount >= 50_000) setShowConfetti(true);

    const unopened = next.cases
      .map((_, i) => i)
      .filter((i) => !next.opened.has(i) && i !== next.playerCase);
    const revealOrder = [...unopened, next.playerCase];
    if (revealOrder.length > 0) {
      setRevealMessage(true);
      setTimeout(() => {
        setRevealMessage(false);
        setRevealingPhase(true);
        revealOrder.forEach((idx, i) => {
          setTimeout(() => {
            setRevealedCases((prev) => new Set(prev).add(idx));
          }, (i + 1) * 800);
        });
        setTimeout(() => {
          setRevealingPhase(false);
        }, (revealOrder.length + 1) * 800 + 1500);
      }, 2000);
    }
  };

  const handleNoDeal = () => {
    const mood = getBankerMood(state, offerHistory);
    setBankerPhrase(pickPhrase.current(banker.noDeal[mood]));
    setState(rejectDeal(state));
  };

  const handleRevealFinal = (swapToIdx?: number) => {
    let s = state;
    if (swapToIdx !== undefined) {
      s = { ...s, playerCase: swapToIdx };
    }
    const next = revealFinal(s);
    setState(next);
    submitScore(next.finalAmount);
  };

  const isAmountEliminated = (amount: number) => {
    for (const idx of state.opened) {
      if (state.cases[idx] === amount) return true;
    }
    return false;
  };

  return (
    <div className="mx-auto max-w-lg pb-20">
      {/* IDLE / INTRO */}
      {state.phase === "pick" && state.playerCase === -1 && !state.started && !showSplash && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-3xl text-foreground text-center">DEAL OR NO DEAL</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            26 maletines con premios de $0,01 a $1.000.000. Elegí uno, abrí los demás y decidí si aceptás la oferta del banquero o seguís jugando.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>🟢 DEAL <span className="text-fifa-gold">(aceptar oferta)</span></span>
            <span>🔴 NO DEAL <span className="text-fifa-gold">(seguir jugando)</span></span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSplash(true);
              setTimeout(() => {
                setShowSplash(false);
                setState((s) => ({ ...s, started: true }));
              }, 3500);
            }}
            className="rounded-full bg-gradient-to-r from-fifa-purple via-fifa-blue to-fifa-teal px-8 py-3 font-display text-lg uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/30 transition-transform hover:scale-105"
          >
            Empezar
          </button>
        </div>
      )}

      {/* Splash GIF */}
      {showSplash && (
        <div className="flex flex-col items-center justify-center py-6">
          <img
            src="/images/deal_intro.GIF"
            alt="Deal or No Deal"
            className="w-full max-w-sm rounded-2xl shadow-2xl shadow-amber-500/20"
          />
        </div>
      )}

      {/* PICK YOUR CASE */}
      {state.phase === "pick" && state.playerCase === -1 && state.started && (
        <div className="flex flex-col items-center gap-3 py-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-foreground">Elegí tu maletín</h3>
          <p className="text-xs text-fifa-dark-gray animate-pulse">Tocá uno para quedártelo</p>
        </div>
      )}

      {/* GAME AREA */}
      {state.playerCase !== -1 && state.phase !== "pick" && (
        <div className="flex flex-col gap-3 py-4">
          {/* Money board */}
          <div className="flex gap-2 px-2">
            <div className="flex-1 flex flex-col gap-[2px]">
              {LOW_AMOUNTS.map((amt) => (
                <div
                  key={amt}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold text-center transition-all duration-500 ${
                    eliminatedAmount === amt
                      ? "bg-red-500/40 text-red-300 ring-1 ring-red-400 scale-110"
                      : isAmountEliminated(amt)
                        ? "bg-gray-800/50 text-gray-600 line-through"
                        : "bg-blue-900/60 text-blue-200 ring-1 ring-blue-500/20"
                  }`}
                >
                  {formatMoney(amt)}
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-[2px]">
              {HIGH_AMOUNTS.map((amt) => (
                <div
                  key={amt}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold text-center transition-all duration-500 ${
                    eliminatedAmount === amt
                      ? "bg-red-500/40 text-red-300 ring-1 ring-red-400 scale-110"
                      : isAmountEliminated(amt)
                        ? "bg-gray-800/50 text-gray-600 line-through"
                        : "bg-amber-900/60 text-amber-200 ring-1 ring-amber-500/20"
                  }`}
                >
                  {formatMoney(amt)}
                </div>
              ))}
            </div>
          </div>

          {/* Round info */}
          {state.phase === "opening" && (
            <p className="text-center text-xs text-fifa-dark-gray">
              Abrí {state.casesLeftThisRound} maletín{state.casesLeftThisRound !== 1 ? "es" : ""} más
            </p>
          )}
        </div>
      )}

      {/* Briefcases grid */}
      {(state.phase === "pick" || state.phase === "opening") && !showReveal && state.started && (
        <div className="grid grid-cols-6 gap-1.5 px-3 py-2">
          {state.cases.map((_, idx) => {
            const isPlayer = idx === state.playerCase;
            const isOpened = state.opened.has(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCaseClick(idx)}
                disabled={isOpened || (state.phase === "opening" && isPlayer)}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1 transition-all ${
                  isOpened
                    ? "opacity-20 grayscale"
                    : isPlayer
                      ? "ring-2 ring-amber-300 shadow-lg shadow-amber-500/30 scale-105"
                      : selectedCase === idx
                        ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30 scale-110"
                        : "hover:scale-105 active:scale-95"
                }`}
              >
                <div className="relative w-[52px] h-[38px] overflow-hidden rounded">
                  <Image src="/images/maletin.png" alt="Maletín" fill className="object-cover scale-[1.6]" />
                  <img
                    src={`https://flagcdn.com/w40/${state.caseFlags[idx]}.png`}
                    alt=""
                    className="absolute top-[70%] left-1/2 -translate-x-1/2 h-[10px] w-[16px] object-cover rounded-[1px]"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Confirm selected case */}
      {selectedCase !== null && !showReveal && (state.phase === "pick" || state.phase === "opening") && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={handleConfirmCase}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-2.5 font-display text-sm uppercase tracking-wider text-black shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
          >
            {state.phase === "pick" ? "Elegir este" : "Abrir"}
          </button>
        </div>
      )}

      {/* Case reveal overlay */}
      {showReveal && revealedAmount !== null && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="relative w-24 h-16">
            <Image src="/images/maletin.png" alt="Maletín" fill className="object-contain" />
          </div>
          <p className={`font-display text-3xl font-bold ${revealedAmount >= 50000 ? "text-red-400" : "text-emerald-400"}`}>
            {formatMoney(revealedAmount)}
          </p>
          <p className="text-xs text-fifa-dark-gray">
            {revealedAmount >= 50000 ? "😬 Esa dolió..." : "👍 Bien sacada"}
          </p>
        </div>
      )}

      {/* Phone ringing */}
      {phoneRinging && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-6xl animate-bounce">📞</span>
          <p className="text-lg font-bold text-amber-400 animate-pulse" style={{ fontFamily: "var(--font-bebas)" }}>
            RING... RING...
          </p>
          <p className="text-xs text-fifa-dark-gray">El banquero está llamando</p>
        </div>
      )}

      {/* Banker thinking */}
      {bankerThinking && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-2 ring-amber-400 shadow-lg shadow-amber-500/30">
            <Image src={banker.image} alt="Banquero" fill className="object-cover" />
          </div>
          <p className="text-sm text-amber-300 animate-pulse">El banquero está pensando...</p>
        </div>
      )}

      {/* Banker offer */}
      {state.phase === "offer" && !phoneRinging && !bankerThinking && (
        <div className="flex flex-col items-center gap-3 py-4 px-4">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-2 ring-amber-400 shadow-lg shadow-amber-500/30">
            <Image src={banker.image} alt="Banquero" fill className="object-cover" />
          </div>
          {bankerPhrase && (
            <p className="text-center text-xs italic text-amber-300 max-w-xs">&ldquo;{bankerPhrase}&rdquo;</p>
          )}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">El banquero ofrece</p>
            <p className="font-display text-4xl text-amber-400" style={{ fontFamily: "var(--font-bebas)" }}>
              {formatMoney(state.offer)}
            </p>
          </div>
          {/* Offer history */}
          {offerHistory.length > 1 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {offerHistory.slice(0, -1).map((o, i) => (
                <span key={i} className="text-[9px] text-fifa-dark-gray/50 line-through">{formatMoney(o)}</span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDeal}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 px-8 py-3 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
            >
              DEAL
            </button>
            <button
              type="button"
              onClick={handleNoDeal}
              className="rounded-full bg-gradient-to-r from-red-500 to-red-700 px-6 py-3 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-105"
            >
              NO DEAL
            </button>
          </div>
        </div>
      )}

      {/* Final — keep or swap */}
      {state.phase === "final" && (() => {
        const lastIdx = state.cases.findIndex((_, i) => i !== state.playerCase && !state.opened.has(i));
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-fifa-dark-gray">Quedan 2 maletines. ¿Qué hacés?</p>
            <div className="flex items-end gap-6">
              <button
                type="button"
                onClick={() => handleRevealFinal()}
                className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 px-6 py-4 ring-2 ring-amber-300 shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
              >
                <div className="relative w-20 h-14">
                  <Image src="/images/maletin.png" alt="Tu maletín" fill className="object-contain" />
                </div>
                <img src={`https://flagcdn.com/w40/${state.caseFlags[state.playerCase]}.png`} alt="" className="h-3 w-5 object-cover rounded-[1px]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Quedarte</span>
              </button>
              <span className="text-lg text-fifa-dark-gray font-display mb-6">o</span>
              <button
                type="button"
                onClick={() => handleRevealFinal(lastIdx)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-gray-600 to-gray-800 px-6 py-4 ring-1 ring-gray-500/30 shadow-lg transition-transform hover:scale-105"
              >
                <div className="relative w-20 h-14">
                  <Image src="/images/maletin.png" alt="Otro maletín" fill className="object-contain" />
                </div>
                {lastIdx >= 0 && <img src={`https://flagcdn.com/w40/${state.caseFlags[lastIdx]}.png`} alt="" className="h-3 w-5 object-cover rounded-[1px]" />}
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Cambiar</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Game over */}
      {/* "Veamos lo que quedaba..." message */}
      {revealMessage && state.phase === "done" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-4xl">🔍</span>
          <p className="font-display text-lg uppercase tracking-wider text-amber-300 text-center animate-pulse">
            Veamos lo que quedaba sin abrir...
          </p>
        </div>
      )}

      {/* Briefcase reveal animation */}
      {revealingPhase && state.phase === "done" && (
        <div className="py-4">
          <div className="grid grid-cols-6 gap-1.5 px-3 py-2">
            {state.cases.map((val, idx) => {
              const isPlayer = idx === state.playerCase;
              const wasOpened = state.opened.has(idx);
              const isRevealed = revealedCases.has(idx);
              if (wasOpened) {
                return (
                  <div key={idx} className="flex flex-col items-center justify-center rounded-lg py-1 opacity-20 grayscale">
                    <div className="relative w-[52px] h-[38px] overflow-hidden rounded">
                      <Image src="/images/maletin.png" alt="Maletín" fill className="object-cover scale-[1.6]" />
                    </div>
                  </div>
                );
              }
              if (isPlayer) {
                return (
                  <div key={idx} className={`flex flex-col items-center justify-center rounded-lg py-1 transition-all duration-500 ${
                    isRevealed ? "scale-110" : "ring-2 ring-amber-300 shadow-lg shadow-amber-500/30"
                  }`}>
                    {isRevealed ? (
                      <div className={`flex items-center justify-center w-[52px] h-[38px] rounded font-bold text-[10px] ring-2 ${
                        val > state.offer ? "bg-red-900/50 text-red-200 ring-red-400/60" : "bg-emerald-900/50 text-emerald-200 ring-emerald-400/60"
                      }`}>
                        {formatMoney(val)}
                      </div>
                    ) : (
                      <div className="relative w-[52px] h-[38px] overflow-hidden rounded">
                        <Image src="/images/maletin.png" alt="Maletín" fill className="object-cover scale-[1.6]" />
                      </div>
                    )}
                    <span className="text-[8px] text-amber-300 font-bold mt-0.5">TUYO</span>
                  </div>
                );
              }
              return (
                <div key={idx} className={`flex flex-col items-center justify-center rounded-lg py-1 transition-all duration-500 ${
                  isRevealed ? "scale-110" : ""
                }`}>
                  {isRevealed ? (
                    <div className={`flex items-center justify-center w-[52px] h-[38px] rounded font-bold text-[10px] ${
                      val >= 50_000 ? "bg-amber-500/30 text-amber-200 ring-1 ring-amber-400/50" : "bg-white/10 text-fifa-dark-gray ring-1 ring-white/10"
                    }`}>
                      {formatMoney(val)}
                    </div>
                  ) : (
                    <div className="relative w-[52px] h-[38px] overflow-hidden rounded">
                      <Image src="/images/maletin.png" alt="Maletín" fill className="object-cover scale-[1.6]" />
                      <img
                        src={`https://flagcdn.com/w40/${state.caseFlags[idx]}.png`}
                        alt=""
                        className="absolute top-[70%] left-1/2 -translate-x-1/2 h-[10px] w-[16px] object-cover rounded-[1px]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {state.phase === "done" && !revealingPhase && !revealMessage && (() => {
        return (
          <div className="flex flex-col items-center gap-3 py-6 relative">
            {/* Confetti */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 40}%`,
                      backgroundColor: ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6"][i % 5],
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {state.dealTaken ? (
              <>
                <span className="text-5xl">🤝</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-emerald-400">DEAL!</h3>
              </>
            ) : (
              <>
                <div className="relative w-20 h-14">
                  <Image src="/images/maletin.png" alt="Maletín" fill className="object-contain" />
                </div>
                <h3 className="font-display text-2xl uppercase tracking-wider text-amber-400">Tu maletín</h3>
              </>
            )}
            <p className="font-display text-4xl text-fifa-gold" style={{ fontFamily: "var(--font-bebas)" }}>
              {formatMoney(state.finalAmount)}
            </p>

            {/* Your briefcase value (after deal) */}
            {state.dealTaken && (
              <div className={`rounded-lg px-4 py-1.5 text-xs font-bold ring-1 ${
                state.cases[state.playerCase] > state.offer ? "bg-red-900/40 text-red-300 ring-red-500/30" : "bg-emerald-900/40 text-emerald-300 ring-emerald-500/30"
              }`}>
                Tu maletín tenía: {formatMoney(state.cases[state.playerCase])}
              </div>
            )}

            {/* Offer history */}
            {offerHistory.length > 0 && (
              <div className="w-full max-w-xs">
                <p className="text-[10px] uppercase tracking-widest text-center text-fifa-dark-gray mb-1">Ofertas del banquero</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {offerHistory.map((o, i) => (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${
                      i === offerHistory.length - 1 && state.dealTaken ? "bg-emerald-900/40 text-emerald-300" : "text-fifa-dark-gray/60"
                    }`}>
                      R{i + 1}: {formatMoney(o)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={start} className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white">
              Jugar de nuevo
            </button>
          </div>
        );
      })()}

      {/* Leaderboard */}
      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Deal or No Deal
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
                <span className="font-display text-sm text-fifa-gold">{formatMoney(entry.score)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
