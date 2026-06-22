"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { CANVAS_W, CANVAS_H, TOTAL_LEVELS, PLATFORM_COLORS, type TriompyState } from "./gameTypes";
import { createInitialState, nextLevel } from "./gameLogic";
import { useGameLoop } from "./useGameLoop";
import { LevelSelect } from "./LevelSelect";

function SplashReveal({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/triompy_intro.png";
    img.onload = () => { imgRef.current = img; };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const REVEAL_MS = 2500;
    const HOLD_MS = 2000;
    const TOTAL_MS = REVEAL_MS + HOLD_MS;

    const frame = (time: number) => {
      if (!startTime.current) startTime.current = time;
      const elapsed = time - startTime.current;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imgRef.current) {
        const progress = Math.min(elapsed / REVEAL_MS, 1);
        // DOS scanline reveal — draw image in horizontal bands from top
        const bandH = 4;
        const totalBands = Math.ceil(canvas.height / bandH);
        const revealedBands = Math.floor(progress * totalBands);

        for (let i = 0; i < revealedBands; i++) {
          const sy = i * bandH;
          const sh = Math.min(bandH, canvas.height - sy);
          ctx.drawImage(
            imgRef.current,
            0, sy / (canvas.height / imgRef.current.height),
            imgRef.current.width, sh / (canvas.height / imgRef.current.height),
            0, sy, canvas.width, sh,
          );
        }

        // Scanline flicker on the reveal edge
        if (progress < 1) {
          const edgeY = revealedBands * bandH;
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(0, edgeY - bandH, canvas.width, bandH * 2);
        }
      }

      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        onDone();
      }
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onDone]);

  return (
    <div className="flex justify-center py-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="w-full max-w-[400px] rounded-xl"
        style={{ aspectRatio: "1/1", imageRendering: "pixelated" }}
        onClick={onDone}
      />
    </div>
  );
}

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

type Screen = "title" | "splash" | "levelSelect" | "playing" | "victory";

export function TriompyGame() {
  const user = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TriompyState>(createInitialState());
  const [uiState, setUiState] = useState<TriompyState>(stateRef.current);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [screen, setScreen] = useState<Screen>("title");
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const scoreSubmitted = useRef(false);

  const onStateChange = useCallback((s: TriompyState) => setUiState(s), []);
  const { startLoop, stopLoop } = useGameLoop(canvasRef, stateRef, onStateChange);

  useEffect(() => {
    fetch("/api/triompy")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  const submitScore = useCallback(async (score: number) => {
    if (scoreSubmitted.current) return;
    scoreSubmitted.current = true;
    try {
      await fetch("/api/triompy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const res = await fetch("/api/triompy");
      if (res.ok) {
        const d = await res.json();
        setLeaderboard(d.leaderboard);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (uiState.status === "lost" || uiState.status === "won") {
      stopLoop();
      submitScore(uiState.score);
    }
    if (uiState.status === "cleared") {
      stopLoop();
      submitScore(uiState.score);
      const updated = new Set(completedLevels).add(uiState.level);
      setCompletedLevels(updated);
      setTimeout(() => {
        if (updated.size >= TOTAL_LEVELS) {
          setScreen("victory");
        } else {
          setScreen("levelSelect");
        }
      }, 1500);
    }
  }, [uiState.status, uiState.score, uiState.level, stopLoop, submitScore]);

  const startLevel = (level: number) => {
    const initial = createInitialState(level);
    stateRef.current = initial;
    setUiState(initial);
    setScreen("playing");
    scoreSubmitted.current = false;
    setTimeout(() => startLoop(), 100);
  };

  const handleRestart = () => {
    stopLoop();
    startLevel(uiState.level);
  };

  const handleBackToLevels = () => {
    stopLoop();
    setPaused(false);
    setScreen("levelSelect");
  };

  const handleResume = () => {
    setPaused(false);
    startLoop();
  };

  useEffect(() => {
    if (screen !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (paused) {
          handleResume();
        } else if (stateRef.current.status === "playing") {
          stopLoop();
          setPaused(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, paused, stopLoop, startLoop]);

  return (
    <div className="mx-auto max-w-lg pb-20">
      {/* TITLE SCREEN */}
      {screen === "title" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground text-center tracking-wider">TRIOMPY</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            La trionda rebota por el estadio. Recolectá todas las banderas para abrir la salida y avanzar de nivel.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>🏁 <span className="text-fifa-gold">+50</span></span>
            <span>⭐ <span className="text-fifa-gold">+200×nivel</span></span>
            <span>🏀 <span className="text-fifa-gold">+200/vida</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span className="text-white/50">Controles:</span>
            <span>⬅️➡️ <span className="text-fifa-gold">Moverse</span></span>
            <span>⬆️ <span className="text-fifa-gold">Salto alto</span></span>
            <span>⬇️ <span className="text-fifa-gold">Frenar</span></span>
          </div>
          <button
            type="button"
            onClick={() => setScreen("splash")}
            className="rounded-full bg-gradient-to-r from-fifa-purple via-fifa-blue to-fifa-teal px-8 py-3 font-display text-lg uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/30 transition-transform hover:scale-105"
          >
            Empezar
          </button>
        </div>
      )}

      {/* VICTORY — all 8 levels completed */}
      {screen === "victory" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <span className="text-6xl">🏆</span>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    left: `${-40 + Math.random() * 140}%`,
                    top: `${-20 + Math.random() * 140}%`,
                    backgroundColor: ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6"][i % 5],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <h2 className="font-display text-3xl uppercase tracking-wider text-fifa-gold">Completaste Triompy!</h2>
          <p className="text-sm text-fifa-dark-gray">8 niveles completados</p>
          <p className="font-display text-4xl text-white">{uiState.score.toLocaleString("es-AR")}</p>
          <p className="text-xs text-fifa-dark-gray">+{uiState.lives * 200} pts por {uiState.lives} vida{uiState.lives !== 1 ? "s" : ""} restante{uiState.lives !== 1 ? "s" : ""}</p>
          <button
            type="button"
            onClick={() => {
              setScreen("title");
              setCompletedLevels(new Set());
            }}
            className="mt-2 rounded-full bg-gradient-to-r from-fifa-purple via-fifa-blue to-fifa-teal px-8 py-3 font-display text-lg uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/30 transition-transform hover:scale-105"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      {/* SPLASH — DOS scanline reveal */}
      {screen === "splash" && <SplashReveal onDone={() => setScreen("levelSelect")} />}

      {/* LEVEL SELECT — Bumpy's style canvas map */}
      {screen === "levelSelect" && (
        <LevelSelect
          score={uiState.score}
          lives={uiState.lives}
          completedLevels={completedLevels}
          onSelect={startLevel}
          onBack={() => setScreen("title")}
        />
      )}

      {/* GAME */}
      {screen === "playing" && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W * 2}
            height={CANVAS_H * 2}
            className="mx-auto w-full max-w-[400px] rounded-xl"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: "none", imageRendering: "pixelated" }}
          />

          {/* Pause overlay */}
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-black/90 px-8 py-6 text-center border border-white/10">
                <p className="font-display text-2xl uppercase tracking-wider text-white">Pausa</p>
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleResume}
                    className="rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToLevels}
                    className="rounded-full bg-white/10 px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                  >
                    Elegir nivel
                  </button>
                </div>
              </div>
            </div>
          )}

          {uiState.status === "cleared" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-black/85 px-8 py-6 text-center border border-emerald-500/30">
                <span className="text-3xl">⭐</span>
                <p className="mt-2 font-display text-xl uppercase tracking-wider text-emerald-400">
                  Nivel {uiState.level}
                </p>
                <p className="text-sm text-fifa-dark-gray">Completado!</p>
                <p className="mt-1 font-display text-2xl text-white">{uiState.score}</p>
              </div>
            </div>
          )}

          {(uiState.status === "lost" || uiState.status === "won") && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-black/85 px-8 py-6 text-center border border-white/10">
                {uiState.status === "won" ? (
                  <>
                    <span className="text-4xl">🏆</span>
                    <p className="mt-2 font-display text-2xl uppercase tracking-wider text-fifa-gold">
                      Completaste Triompy!
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">💀</span>
                    <p className="mt-2 font-display text-2xl uppercase tracking-wider text-red-400">
                      Game Over
                    </p>
                  </>
                )}
                <p className="mt-2 font-display text-3xl text-white">{uiState.score}</p>
                <button
                  type="button"
                  onClick={() => {
                    setScreen("title");
                    setCompletedLevels(new Set());
                  }}
                  className="mt-4 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                >
                  Jugar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Triompy
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
                  {entry.position === 1 ? "🥇" : entry.position === 2 ? "🥈" : entry.position === 3 ? "🥉" : entry.position}
                </span>
                <AvatarDisplay avatar={entry.avatar} size="sm" />
                <span className="flex-1 text-xs font-medium text-foreground truncate">
                  {entry.name}
                </span>
                <span className="font-display text-sm text-fifa-gold">
                  {entry.score.toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
