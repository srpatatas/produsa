"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Direction, MAX_LIVES, ENEMY_IMAGES } from "./gameTypes";
import { useProdmanLoop } from "./useGameLoop";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

function DPadButton({ dir, onDir, label }: { dir: Direction; onDir: (d: Direction | null) => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = (e: TouchEvent) => { e.preventDefault(); onDir(dir); };
    el.addEventListener("touchstart", start, { passive: false });
    return () => {
      el.removeEventListener("touchstart", start);
    };
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

export function ProdmanGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(336);
  const playerAvatar = user.avatar?.startsWith("http") ? user.avatar : null;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth - 32, 420);
      setCanvasWidth(Math.floor(w / 21) * 21);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { canvasRef, canvasHeight, score, lives, status, start, setDirection } = useProdmanLoop(
    canvasWidth,
    playerAvatar,
  );

  useEffect(() => {
    fetch("/api/prodman")
      .then((r) => r.ok ? r.json() : { leaderboard: [] })
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "won" && status !== "lost") return;
    if (status === "won") {
      fetch("/api/prodman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/prodman")
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
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [setDirection]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground">PROD-MAN</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Comé todos los puntos y evitá a los comodines. Agarrá las triondas para poder comerlos a ellos.
          </p>
          <div className="flex gap-6 text-[11px] text-fifa-dark-gray">
            <span>❤️ {MAX_LIVES} vidas</span>
            <span>🟡 10 pts</span>
            <span><img src="/images/trionda.png" alt="trionda" className="inline h-4 w-4" /> 50 pts</span>
            <span>👻 200 pts</span>
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

      {(status === "playing" || status === "won" || status === "lost") && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={i < lives ? "text-sm" : "text-sm opacity-20"}>
                  {i < lives ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
            <span className="font-display text-2xl text-fifa-gold">{score}</span>
          </div>

          <div className="relative overflow-visible">
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-blue/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
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

            {status === "won" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/40 backdrop-blur-[2px]">
                <span className="text-4xl">🎉</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-green">Ganaste!</h3>
                <span className="font-display text-4xl text-fifa-gold">{score} pts</span>
                <button
                  type="button"
                  onClick={start}
                  className="mt-1 rounded-full bg-fifa-green px-6 py-2.5 font-display text-sm uppercase tracking-wider text-black"
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
          🏆 Prod-Man
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-center text-xs text-fifa-dark-gray/50 py-2">
            Nadie ganó todavía. ¡Sé el primero!
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
