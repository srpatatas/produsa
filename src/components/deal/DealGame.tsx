"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import {
  AMOUNTS, LOW_AMOUNTS, HIGH_AMOUNTS,
  COMODIN_IMAGES, BANKER_PHRASES_OFFER, BANKER_PHRASES_NO_DEAL, BANKER_PHRASES_DEAL,
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
  const [bankerImg] = useState(() => Math.floor(Math.random() * 3));
  const [bankerPhrase, setBankerPhrase] = useState("");
  const [revealedAmount, setRevealedAmount] = useState<number | null>(null);
  const [showReveal, setShowReveal] = useState(false);

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
  }, []);

  const handleCaseClick = (idx: number) => {
    if (state.phase === "pick") {
      setState(pickCase(state, idx));
    } else if (state.phase === "opening") {
      if (idx === state.playerCase || state.opened.has(idx)) return;
      setRevealedAmount(state.cases[idx]);
      setShowReveal(true);
      setTimeout(() => {
        setShowReveal(false);
        setRevealedAmount(null);
        const next = openCase(state, idx);
        setState(next);
        if (next.phase === "offer") {
          const phrases = BANKER_PHRASES_OFFER[bankerImg];
          setBankerPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        }
      }, 1200);
    }
  };

  const handleDeal = () => {
    const phrases = BANKER_PHRASES_DEAL[bankerImg];
    setBankerPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    const next = acceptDeal(state);
    setState(next);
    submitScore(next.finalAmount);
  };

  const handleNoDeal = () => {
    const phrases = BANKER_PHRASES_NO_DEAL[bankerImg];
    setBankerPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setState(rejectDeal(state));
  };

  const handleRevealFinal = () => {
    const next = revealFinal(state);
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
      {state.phase === "pick" && state.playerCase === -1 && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-3xl text-foreground text-center">DEAL OR NO DEAL</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Elegí un maletín y descubrí cuánto vale. El banquero te va a ofrecer plata para que dejes de jugar. ¿Aceptás o seguís?
          </p>
          <p className="text-xs text-fifa-dark-gray animate-pulse">Elegí tu maletín</p>
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
                  className={`rounded px-2 py-0.5 text-[10px] font-bold text-center transition-all ${
                    isAmountEliminated(amt)
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
                  className={`rounded px-2 py-0.5 text-[10px] font-bold text-center transition-all ${
                    isAmountEliminated(amt)
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
      {(state.phase === "pick" || state.phase === "opening") && !showReveal && (
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
                className={`relative flex flex-col items-center justify-center rounded-lg py-2 transition-all ${
                  isOpened
                    ? "bg-gray-800/30 opacity-30"
                    : isPlayer
                      ? "bg-gradient-to-b from-amber-500 to-amber-700 ring-2 ring-amber-300 shadow-lg shadow-amber-500/30"
                      : "bg-gradient-to-b from-gray-600 to-gray-800 ring-1 ring-gray-500/30 hover:from-gray-500 hover:to-gray-700 hover:scale-105 active:scale-95"
                }`}
              >
                <span className="text-lg">💼</span>
                <span className="text-[9px] font-bold text-white/80">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Case reveal overlay */}
      {showReveal && revealedAmount !== null && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <span className="text-5xl">💼</span>
          <p className={`font-display text-3xl font-bold ${revealedAmount >= 50000 ? "text-red-400" : "text-emerald-400"}`}>
            {formatMoney(revealedAmount)}
          </p>
          <p className="text-xs text-fifa-dark-gray">
            {revealedAmount >= 50000 ? "😬 Esa dolió..." : "👍 Bien sacada"}
          </p>
        </div>
      )}

      {/* Banker offer */}
      {state.phase === "offer" && (
        <div className="flex flex-col items-center gap-4 py-6 px-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-amber-400 shadow-lg shadow-amber-500/30">
            <Image src={COMODIN_IMAGES[bankerImg]} alt="Banquero" fill className="object-cover" />
          </div>
          {bankerPhrase && (
            <p className="text-center text-sm italic text-amber-300 max-w-xs">&ldquo;{bankerPhrase}&rdquo;</p>
          )}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">El banquero ofrece</p>
            <p className="font-display text-4xl text-amber-400" style={{ fontFamily: "var(--font-bebas)" }}>
              {formatMoney(state.offer)}
            </p>
          </div>
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

      {/* Final reveal */}
      {state.phase === "final" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-fifa-dark-gray">Tu maletín contiene...</p>
          <button
            type="button"
            onClick={handleRevealFinal}
            className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 px-12 py-6 ring-2 ring-amber-300 shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
          >
            <span className="text-4xl">💼</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Abrir maletín</span>
          </button>
        </div>
      )}

      {/* Game over */}
      {state.phase === "done" && (
        <div className="flex flex-col items-center gap-4 py-8">
          {state.dealTaken ? (
            <>
              <span className="text-5xl">🤝</span>
              <h3 className="font-display text-2xl uppercase tracking-wider text-emerald-400">DEAL!</h3>
              <p className="text-sm text-fifa-dark-gray">Aceptaste la oferta del banquero</p>
            </>
          ) : (
            <>
              <span className="text-5xl">💼</span>
              <h3 className="font-display text-2xl uppercase tracking-wider text-amber-400">Tu maletín</h3>
            </>
          )}
          <p className="font-display text-4xl text-fifa-gold" style={{ fontFamily: "var(--font-bebas)" }}>
            {formatMoney(state.finalAmount)}
          </p>
          {state.dealTaken && (
            <p className="text-xs text-fifa-dark-gray">
              Tu maletín tenía: <span className={state.cases[state.playerCase] > state.offer ? "text-red-400" : "text-emerald-400"}>
                {formatMoney(state.cases[state.playerCase])}
              </span>
            </p>
          )}
          <button type="button" onClick={start} className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white">
            Jugar de nuevo
          </button>
        </div>
      )}

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
