"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { useArkanoidLoop } from "./useGameLoop";
import { CANVAS_H, CANVAS_W } from "./gameTypes";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

export function ArkanoidGame() {
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

  const {
    canvasRef,
    canvasHeight,
    score,
    lives,
    level,
    status,
    start,
    goNextLevel,
    movePaddle,
  } = useArkanoidLoop(canvasWidth);

  useEffect(() => {
    fetch("/api/arkanoid")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "lost") return;
    if (score > 0) {
      fetch("/api/arkanoid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/arkanoid")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const paddlePosRef = useRef(0.5);
  const keysDown = useRef(new Set<string>());

  const wrappedMovePaddle = useCallback((v: number) => {
    paddlePosRef.current = v;
    movePaddle(v);
  }, [movePaddle]);

  useEffect(() => {
    if (status === "playing" && gameAreaRef.current) {
      const top = gameAreaRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [status]);

  // Mouse/touch paddle control
  const handlePointer = useCallback(
    (clientX: number) => {
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const normalized = (clientX - rect.left) / rect.width;
      wrappedMovePaddle(normalized);
    },
    [wrappedMovePaddle]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handlePointer(e.touches[0].clientX);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [handlePointer]);

  // Keyboard arrow controls
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        keysDown.current.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const step = 0.008;
    let raf = 0;
    const tick = () => {
      let pos = paddlePosRef.current;
      let moved = false;
      if (keysDown.current.has("ArrowLeft")) { pos -= step; moved = true; }
      if (keysDown.current.has("ArrowRight")) { pos += step; moved = true; }
      if (moved) wrappedMovePaddle(Math.max(0.05, Math.min(0.95, pos)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, wrappedMovePaddle]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground">ARKANUSA</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Rompé los bloques con la trionda. Cuidado con los comodines, aguantan 3 golpes.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>Bandera <span className="text-fifa-gold">(100 pts)</span></span>
            <span>Cabeza de grupo <span className="text-fifa-gold">(200 pts)</span></span>
            <span>Comodín <span className="text-fifa-gold">(500 pts)</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>🥾 Agranda la paleta</span>
            <span>📺 VAR: pelota lenta 5s</span>
            <span>🟥 Roja: elimina una fila</span>
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

      {(status === "playing" || status === "lost" || status === "cleared") && (
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

          <div ref={canvasContainerRef} className="relative overflow-visible" style={{ touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-blue/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
            />

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/70 backdrop-blur-sm">
                <span className="text-4xl">⚽</span>
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
          </div>

          {status === "playing" && (
            <p className="text-[10px] text-fifa-dark-gray/50">
              Mouse, dedo, o ← → para mover la paleta
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Arkanusa
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
