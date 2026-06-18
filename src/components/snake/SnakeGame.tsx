"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Direction } from "./gameTypes";
import { useSnakeLoop } from "./useGameLoop";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

function DPadButton({ dir, onDir, label }: { dir: Direction; onDir: (d: Direction) => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = (e: TouchEvent) => { e.preventDefault(); onDir(dir); };
    el.addEventListener("touchstart", start, { passive: false });
    return () => { el.removeEventListener("touchstart", start); };
  }, [dir, onDir]);

  return (
    <button
      ref={ref}
      type="button"
      onMouseDown={() => onDir(dir)}
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-white/70 active:bg-white/20 active:text-white select-none"
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", touchAction: "none" }}
    >
      {label}
    </button>
  );
}

export function SnakeGame() {
  const user = useUser();
  const [canvasSize, setCanvasSize] = useState(336);
  const playerAvatar = user.avatar?.startsWith("http") ? user.avatar : null;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth - 32, 420);
      setCanvasSize(Math.floor(w / 21) * 21);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { canvasRef, score, status, start, setDirection } = useSnakeLoop(canvasSize, playerAvatar);

  useEffect(() => {
    fetch("/api/snake")
      .then((r) => r.ok ? r.json() : { leaderboard: [] })
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "lost") return;
    if (score > 0) {
      fetch("/api/snake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/snake")
      .then((r) => r.ok ? r.json() : { leaderboard: [] })
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score]);

  useEffect(() => {
    const gameKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "s", "S", "d", "D"]);
    const onKey = (e: KeyboardEvent) => {
      if (gameKeys.has(e.key)) e.preventDefault();
      switch (e.key) {
        case "ArrowUp": case "w": case "W": setDirection(Direction.UP); break;
        case "ArrowRight": case "d": case "D": setDirection(Direction.RIGHT); break;
        case "ArrowDown": case "s": case "S": setDirection(Direction.DOWN); break;
        case "ArrowLeft": case "a": case "A": setDirection(Direction.LEFT); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground text-center">VIBORUSA</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Comé banderas del mundial y crecé. Evitá los comodines y no te muerdas la cola.
          </p>
          <div className="flex gap-6 text-[11px] text-fifa-dark-gray">
            <span><img src="https://flagcdn.com/w40/ar.png" alt="flag" className="inline h-3 w-5 rounded-sm" /> 50 pts</span>
            <span><img src="/images/trionda.png" alt="trionda" className="inline h-4 w-4" /> 200 pts</span>
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
          <div className="flex w-full items-center justify-center">
            <span className="font-display text-2xl text-fifa-gold">{score}</span>
          </div>

          <div className="relative overflow-visible">
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-green/50"
              style={{ width: canvasSize, height: canvasSize, touchAction: "none" }}
            />

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/70 backdrop-blur-sm">
                <span className="text-4xl">💀</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Game Over</h3>
                <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
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
                Usá las flechas para moverte
              </p>
              <div className="md:hidden select-none" style={{ touchAction: "none" }}>
                <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                  <div />
                  <DPadButton dir={Direction.UP} onDir={setDirection} label="▲" />
                  <div />
                  <DPadButton dir={Direction.LEFT} onDir={setDirection} label="◀" />
                  <div />
                  <DPadButton dir={Direction.RIGHT} onDir={setDirection} label="▶" />
                  <div />
                  <DPadButton dir={Direction.DOWN} onDir={setDirection} label="▼" />
                  <div />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Viborusa
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
