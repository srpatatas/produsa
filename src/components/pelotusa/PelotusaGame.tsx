"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { usePelotusaLoop } from "./useGameLoop";
import { CANVAS_H, CANVAS_W } from "./gameTypes";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

const MEDALS = [
  { min: 70, emoji: "🐐", label: "D10S", sub: "Inmortal", color: "text-emerald-400" },
  { min: 50, emoji: "🏆", label: "México 86", sub: "La copa eterna", color: "text-yellow-300" },
  { min: 35, emoji: "🔵", label: "Napoli", sub: "La leyenda napolitana", color: "text-blue-400" },
  { min: 20, emoji: "✨", label: "Pibe de Oro", sub: "El apodo legendario", color: "text-fifa-gold" },
  { min: 8,  emoji: "🧅", label: "Cebollita", sub: "Argentinos Juniors", color: "text-amber-600" },
];

function getMedal(score: number) {
  return MEDALS.find((m) => score >= m.min) || null;
}

const BEST_KEY = "flappy-d10s-best";

export function PelotusaGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [best, setBest] = useState(0);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(BEST_KEY)) || 0); } catch {}
  }, []);

  useEffect(() => {
    const update = () => {
      const maxW = Math.min(window.innerWidth - 32, 400);
      const maxH = window.innerHeight - 200;
      const wFromH = maxH / CANVAS_H * CANVAS_W;
      setCanvasWidth(Math.floor(Math.min(maxW, wFromH)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const {
    canvasRef,
    canvasHeight,
    score,
    status,
    start,
    doFlap,
  } = usePelotusaLoop(canvasWidth);

  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "playing" && gameAreaRef.current) {
      const top = gameAreaRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/flappy")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  // Score submit + best score + leaderboard refresh
  useEffect(() => {
    if (status !== "lost") return;
    if (score > best) {
      setBest(score);
      try { localStorage.setItem(BEST_KEY, String(score)); } catch {}
    }
    if (score > 0) {
      fetch("/api/flappy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/flappy")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score, best]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        doFlap();
      }
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [doFlap]);

  const handleTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    doFlap();
  }, [doFlap]);

  const medal = status === "lost" ? getMedal(score) : null;
  const isNewBest = status === "lost" && score > 0 && score >= best;

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "idle" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground text-center">FLAPPY D10S</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Hacé jueguitos con la trionda como el D10S. Tocá para mantenerla en el aire, meté goles pasando entre los arcos, juntá banderas y esquivá a los comodines.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>Gol <span className="text-fifa-gold">(1 pt)</span></span>
            <span>Bandera <span className="text-fifa-gold">(2 pts)</span></span>
            <span>Comodín <span className="text-red-400">(-3 pts)</span></span>
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

      {(status === "playing" || status === "lost") && (
        <div ref={gameAreaRef} className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Puntos</span>
              <p className="font-display text-2xl text-fifa-gold">{score}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Mejor</span>
              <p className="font-display text-2xl text-foreground">{Math.max(best, score)}</p>
            </div>
          </div>

          <div
            className="relative overflow-hidden select-none"
            style={{ touchAction: "none", WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none" }}
            onPointerDown={handleTap}
          >
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-purple/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
            />

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/70 backdrop-blur-sm">
                {medal ? (
                  <>
                    <span className="text-5xl">{medal.emoji}</span>
                    <span className={`font-display text-sm uppercase tracking-widest ${medal.color}`}>{medal.label}</span>
                    <span className="text-[10px] italic text-fifa-dark-gray">{medal.sub}</span>
                  </>
                ) : (
                  <span className="text-4xl">⚽</span>
                )}
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Game Over</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                {isNewBest && (
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">¡Nuevo récord!</span>
                )}
                <button
                  type="button"
                  onClick={start}
                  className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                >
                  Jugar de nuevo
                </button>
              </div>
            )}
          </div>

          {status === "playing" && (
            <>
              <p className="text-[10px] text-fifa-dark-gray/50 hidden md:block">
                Espacio para volar
              </p>
              <p className="text-[10px] text-fifa-dark-gray/50 md:hidden">
                Tocá para volar
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Flappy Trionda
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
                <span className="font-display text-lg text-foreground">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
