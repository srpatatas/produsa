"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Direction, BACKGROUND_IMAGES, ENEMIES, WIN_PCT, MAX_LIVES, type EnemyConfig } from "./gameTypes";
import { useGameLoop } from "./useGameLoop";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
  timeSeconds: number;
  livesLeft: number;
}

function DPadButton({ dir, onDir, label }: { dir: Direction; onDir: (d: Direction | null) => void; label: string }) {
  return (
    <button
      type="button"
      onTouchStart={(e) => { e.preventDefault(); onDir(dir); }}
      onTouchEnd={(e) => { e.preventDefault(); onDir(null); }}
      onMouseDown={() => onDir(dir)}
      onMouseUp={() => onDir(null)}
      onMouseLeave={() => onDir(null)}
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-white/70 active:bg-white/20 active:text-white select-none"
    >
      {label}
    </button>
  );
}

export function GalsPanicGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(360);
  const canvasHeight = Math.round(canvasWidth * 0.75);

  const [bgImage] = useState(() => pickRandom(BACKGROUND_IMAGES));
  const [enemy, setEnemy] = useState<EnemyConfig>(() => pickRandom(ENEMIES));
  const [taunt, setTaunt] = useState<string | null>(null);
  const tauntTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const scoreSavedRef = useRef(false);

  const playerAvatar = user.avatar?.startsWith("http") ? user.avatar : null;

  useEffect(() => {
    const update = () => {
      setCanvasWidth(Math.min(window.innerWidth - 32, 480));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { canvasRef, revealedPct, lives, elapsed, enemyScreenPos, status, start, restart, setDirection } = useGameLoop(
    canvasWidth,
    canvasHeight,
    bgImage,
    enemy.image,
    playerAvatar,
  );

  const prevLivesRef = useRef(MAX_LIVES);
  useEffect(() => {
    if (lives < prevLivesRef.current && lives > 0) {
      setTaunt(pickRandom(enemy.taunts));
      if (tauntTimerRef.current) clearTimeout(tauntTimerRef.current);
      tauntTimerRef.current = setTimeout(() => setTaunt(null), 2500);
    }
    prevLivesRef.current = lives;
  }, [lives, enemy.taunts]);

  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setTaunt(pickRandom(enemy.taunts));
        if (tauntTimerRef.current) clearTimeout(tauntTimerRef.current);
        tauntTimerRef.current = setTimeout(() => setTaunt(null), 2500);
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      if (tauntTimerRef.current) clearTimeout(tauntTimerRef.current);
    };
  }, [status, enemy.taunts]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lockedRef = useRef<"h" | "v" | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lockedRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    if (!lockedRef.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      return;
    }

    if (lockedRef.current === "v") return;
    e.preventDefault();

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
    } else {
      setDirection(dy > 0 ? Direction.DOWN : Direction.UP);
    }
  }, [setDirection]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lockedRef.current = null;
    setDirection(null);
  }, [setDirection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: TouchEvent) => {
      if (lockedRef.current === "h") e.preventDefault();
    };
    canvas.addEventListener("touchmove", handler, { passive: false });
    return () => canvas.removeEventListener("touchmove", handler);
  }, [canvasRef]);

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
    const onKeyUp = (e: KeyboardEvent) => {
      if (gameKeys.has(e.key)) setDirection(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setDirection]);

  useEffect(() => {
    fetch("/api/panic")
      .then((r) => r.ok ? r.json() : { leaderboard: [] })
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "won" && status !== "lost") return;
    if (status === "won" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      const score = calcScore();
      fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, timeSeconds: elapsed, livesLeft: lives, revealedPct }),
      }).catch(() => {});
    }
    fetch("/api/panic")
      .then((r) => r.ok ? r.json() : { leaderboard: [] })
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status]);

  const handleRestart = useCallback(() => {
    setEnemy(pickRandom(ENEMIES));
    setTaunt(null);
    scoreSavedRef.current = false;
    start();
  }, [start]);

  const pctNorm = Math.min(100, Math.round((revealedPct / WIN_PCT) * 100));
  const formatTime = (s: number) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  const INITIAL_PCT = 11;
  const calcScore = () => {
    const pctPoints = Math.max(0, revealedPct - INITIAL_PCT) * 100;
    const livesBonus = status === "won" ? lives * 500 : 0;
    return pctPoints + livesBonus;
  };

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground">PRODUSA PANIC</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Recorré el borde y aventurate al centro para reclamar territorio. Descubrí la foto oculta. ¡Cuidado con el enemigo!
          </p>
          <div className="flex gap-6 text-[11px] text-fifa-dark-gray">
            <span>❤️ {MAX_LIVES} vidas</span>
            <span>🏆 {WIN_PCT}% para ganar</span>
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

      {(status === "playing" || status === "revealing" || status === "won" || status === "lost") && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={i < lives ? "text-sm" : "text-sm opacity-20"}>
                  {i < lives ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
            <span className="font-display text-lg text-fifa-gold">{calcScore()}</span>
            <span className="font-display text-sm text-fifa-dark-gray">{formatTime(elapsed)}</span>
          </div>

          <div className="flex w-full items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-fifa-purple via-fifa-blue to-fifa-teal transition-all duration-300"
                style={{ width: pctNorm + "%" }}
              />
            </div>
            <span className="text-xs font-semibold text-fifa-dark-gray w-10 text-right">{revealedPct}%</span>
          </div>

          <div className="relative overflow-visible">
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-1 ring-white/10"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {taunt && status === "playing" && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: Math.min(Math.max(enemyScreenPos.x, 60), canvasWidth - 60),
                  top: Math.max(enemyScreenPos.y - 45, 4),
                  transform: "translateX(-50%)",
                  animation: "fadeInUp 0.15s ease-out",
                }}
              >
                <div className="relative rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-black shadow-lg text-center max-w-[180px]">
                  {taunt}
                  <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
                </div>
              </div>
            )}

            {status === "revealing" && (
              <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                <div className="birthday-confetti">
                  {Array.from({ length: 30 }).map((_, j) => {
                    const colors = ["#f43f5e", "#fbbf24", "#4ade80", "#6381f5", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
                    return (
                      <span
                        key={j}
                        style={{
                          left: `${5 + (j * 47) % 90}%`,
                          top: `${-5 + (j * 13) % 10}%`,
                          backgroundColor: colors[j % colors.length],
                          animationDuration: `${1.5 + (j % 5) * 0.3}s`,
                          animationDelay: `${(j % 7) * 0.15}s`,
                          animationIterationCount: "infinite",
                          borderRadius: j % 3 === 0 ? "50%" : "1px",
                          width: j % 4 === 0 ? "5px" : "7px",
                          height: j % 4 === 0 ? "5px" : "7px",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {status === "lost" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/70 backdrop-blur-sm">
                <span className="text-4xl">💀</span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Te atraparon!</h3>
                <div className="flex gap-4 text-xs text-white/60">
                  <span>⏱ {formatTime(elapsed)}</span>
                  <span>📊 {revealedPct}%</span>
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
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
                <span className="font-display text-4xl text-fifa-gold">{calcScore()}</span>
                <div className="flex gap-4 text-[11px] text-white/60">
                  <span>⏱ {formatTime(elapsed)}</span>
                  <span>❤️ {lives}/{MAX_LIVES}</span>
                  <span>📊 {revealedPct}%</span>
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
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

      <div className="mx-auto max-w-lg mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Produsa Panic
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
                  {entry.position}
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
