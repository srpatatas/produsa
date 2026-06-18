"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { useTetrisLoop } from "./useGameLoop";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

function TouchButton({
  onAction,
  label,
  className,
}: {
  onAction: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = (e: TouchEvent) => {
      e.preventDefault();
      onAction();
      intervalRef.current = setInterval(onAction, 100);
    };
    const end = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      end();
    };
  }, [onAction]);

  return (
    <button
      ref={ref}
      type="button"
      onMouseDown={onAction}
      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg text-white/70 active:bg-white/20 active:text-white select-none ${className ?? ""}`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", touchAction: "none" }}
    >
      {label}
    </button>
  );
}

export function TetrisGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(250);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const update = () => {
      const overhead = 230;
      const availH = window.innerHeight - overhead;
      const cellFromH = Math.floor(availH / 20);
      const cellFromW = Math.floor((window.innerWidth - 32) / 10);
      const cell = Math.min(cellFromH, cellFromW, 30);
      setCanvasWidth(cell * 10);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const {
    canvasRef,
    previewRef,
    canvasHeight,
    score,
    lines,
    level,
    status,
    start,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotate,
  } = useTetrisLoop(canvasWidth);

  useEffect(() => {
    fetch("/api/tetris")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "lost") return;
    if (score > 0) {
      fetch("/api/tetris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/tetris")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (status !== "playing") return;
      const gameKeys = new Set([
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        " ", "w", "W", "a", "A", "s", "S", "d", "D",
      ]);
      if (gameKeys.has(e.key)) e.preventDefault();
      switch (e.key) {
        case "ArrowLeft": case "a": case "A": moveLeft(); break;
        case "ArrowRight": case "d": case "D": moveRight(); break;
        case "ArrowDown": case "s": case "S": softDrop(); break;
        case "ArrowUp": case "w": case "W": rotate(); break;
        case " ": hardDrop(); break;
      }
    },
    [status, moveLeft, moveRight, softDrop, hardDrop, rotate]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground text-center">PRODUTRIS</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Apilá bloques mundialistas y limpiá líneas. Cada 10 líneas subís de nivel.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>1 línea = GOL <span className="text-fifa-gold">(100 pts)</span></span>
            <span>4 líneas = GOLAZO <span className="text-fifa-gold">(800 pts)</span></span>
            <span><img src="/images/trionda.png" alt="trionda" className="inline h-4 w-4" /> Trionda = limpia fila <span className="text-fifa-gold">(300 pts)</span></span>
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
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Puntos</span>
              <p className="font-display text-2xl text-fifa-gold">{score}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Líneas</span>
              <p className="font-display text-2xl text-foreground">{lines}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Nivel</span>
              <p className="font-display text-2xl text-foreground">{level}</p>
            </div>
          </div>

          <div className="relative flex items-start justify-center gap-3 overflow-visible">
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-purple/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
            />
            <div className="flex flex-col items-center gap-1 pt-1">
              <span className="text-[9px] uppercase tracking-widest text-fifa-dark-gray">Next</span>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                <canvas ref={previewRef} />
              </div>
            </div>

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/70 backdrop-blur-sm">
                <span className="text-4xl">🧱</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Game Over</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                <p className="text-xs text-fifa-dark-gray">{lines} líneas · Nivel {level}</p>
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
                ← → mover · ↑ rotar · ↓ bajar · espacio soltar
              </p>
              <div className="md:hidden select-none" style={{ touchAction: "none" }}>
                <div className="flex items-center justify-center gap-4">
                  <TouchButton onAction={moveLeft} label="◀" />
                  <TouchButton onAction={rotate} label="↻" />
                  <TouchButton
                    onAction={hardDrop}
                    label="⤓"
                    className="bg-fifa-purple/30"
                  />
                  <TouchButton onAction={moveRight} label="▶" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Produtris
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
