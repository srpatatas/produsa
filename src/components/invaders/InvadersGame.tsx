"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { useInvadersLoop } from "./useGameLoop";
import { CANVAS_H, CANVAS_W } from "./gameTypes";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

export function InvadersGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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

  const playerAvatar = user.avatar?.startsWith("http") ? user.avatar : null;

  const {
    canvasRef,
    canvasHeight,
    score,
    lives,
    level,
    status,
    start,
    goNextLevel,
    touchXRef,
    touchShootRef,
  } = useInvadersLoop(canvasWidth, playerAvatar);

  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "playing" && gameAreaRef.current) {
      const top = gameAreaRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/invaders")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "lost" && status !== "won") return;
    if (score > 0) {
      fetch("/api/invaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/invaders")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score]);

  const isGameOver = status === "lost" || status === "won";

  // Touch handlers
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    touchXRef.current = e.touches[0].clientX - rect.left;
  }, [touchXRef]);

  const handleTouchEnd = useCallback(() => {
    touchXRef.current = null;
  }, [touchXRef]);

  const handleTap = useCallback(() => {
    touchShootRef.current = true;
  }, [touchShootRef]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground">FIFA INVADERS</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Las banderas invaden la cancha. Dispará con la trionda y derribá a todos. Cuidado con los comodines.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>Bandera <span className="text-fifa-gold">(100 pts)</span></span>
            <span>Comodín boss <span className="text-fifa-gold">(1000 pts)</span></span>
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

      {(status === "playing" || status === "lost" || status === "cleared" || status === "won") && (
        <div ref={gameAreaRef} className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Puntos</span>
              <p className="font-display text-2xl text-fifa-gold">{score}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Vidas</span>
              <p className="font-display text-2xl text-foreground">{"❤️".repeat(lives)}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Nivel</span>
              <p className="font-display text-2xl text-foreground">{level}</p>
            </div>
          </div>

          <div
            className="relative overflow-visible"
            style={{ touchAction: "none" }}
            onTouchMove={handleTouch}
            onTouchStart={(e) => { handleTouch(e); handleTap(); }}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-purple/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
            />

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/70 backdrop-blur-sm">
                <span className="text-4xl">👾</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Game Over</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                <p className="text-xs text-fifa-dark-gray">Nivel {level}</p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                >
                  Jugar de nuevo
                </button>
              </div>
            )}

            {status === "cleared" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/50 backdrop-blur-sm">
                <span className="text-4xl">🏆</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-gold">Nivel {level} completado</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                <button
                  type="button"
                  onClick={goNextLevel}
                  className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                >
                  Siguiente nivel
                </button>
              </div>
            )}

            {status === "won" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/50 backdrop-blur-sm">
                <span className="text-4xl">🏆</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-gold">¡CAMPEÓN!</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                <p className="text-xs text-fifa-dark-gray">Completaste los 3 niveles</p>
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
                ← → mover · espacio disparar
              </p>
              <p className="text-[10px] text-fifa-dark-gray/50 md:hidden">
                Deslizá para mover · tocá para disparar
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 FIFA Invaders
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
