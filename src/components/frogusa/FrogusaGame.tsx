"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { useFrogusaLoop, type StadiumInfo, type ParticipantInfo } from "./useGameLoop";
import { CANVAS_H, CANVAS_W, VENUE_TO_STADIUM } from "./gameTypes";
import { getTodayUnifiedMatches, getNextUnifiedMatch } from "@/lib/unifiedMatches";
import { getTeam } from "@/data/teams";

interface LeaderboardEntry {
  position: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
}

export function FrogusaGame() {
  const user = useUser();
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

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

  const stadiumPool = useMemo<StadiumInfo[]>(() => {
    const now = Date.now();
    let matches = getTodayUnifiedMatches().filter((m) => new Date(m.kickoff).getTime() > now - 2 * 60 * 60 * 1000);
    if (matches.length === 0) {
      const next = getNextUnifiedMatch();
      if (next) matches = [next];
    }
    return matches
      .filter((m) => m.venue && VENUE_TO_STADIUM[m.venue])
      .map((m) => {
        const home = m.homeTeamId ? getTeam(m.homeTeamId) : null;
        const away = m.awayTeamId ? getTeam(m.awayTeamId) : null;
        return {
          image: VENUE_TO_STADIUM[m.venue]!,
          label: m.venue,
          homeFlag: home?.flagCode,
          awayFlag: away?.flagCode,
        };
      });
  }, []);

  const {
    canvasRef,
    canvasHeight,
    score,
    lives,
    goals,
    status,
    start,
    handleTouchStart,
    handleTouchEnd,
    collectedFriends,
  } = useFrogusaLoop(canvasWidth, playerAvatar, stadiumPool, participants);

  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "playing" && gameAreaRef.current) {
      const top = gameAreaRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => (r.ok ? r.json() : { ranking: [] }))
      .then((d) => {
        const others = (d.ranking || [])
          .filter((r: { user: { id: number; avatar: string } }) => r.user.id !== user.id && r.user.avatar?.startsWith("http"))
          .map((r: { user: { name: string; avatar: string } }) => ({ name: r.user.name, avatar: r.user.avatar }));
        setParticipants(others);
      })
      .catch(() => {});
  }, [user.id]);

  useEffect(() => {
    fetch("/api/frogusa")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "lost" && status !== "won") return;
    if (score > 0) {
      fetch("/api/frogusa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      }).catch(() => {});
    }
    fetch("/api/frogusa")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, [status, score]);

  return (
    <div className="mx-auto max-w-lg">
      {status === "loading" && (
        <div className="flex justify-center py-20 text-fifa-dark-gray">Cargando...</div>
      )}

      {status === "idle" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="font-title text-4xl text-foreground text-center">FROGUSA</h2>
          <p className="text-center text-sm text-fifa-dark-gray max-w-xs">
            Llegá al estadio a tiempo. Esquivá los micros en la calle y subite a los carritos VIP para no ser tragado por la hinchada. Juntá amigos y cuidado con los comodines.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-fifa-dark-gray">
            <span>Llegar <span className="text-fifa-gold">(5 pts)</span></span>
            <span>Amigo <span className="text-fifa-gold">(1 pt)</span></span>
            <span>Comodín <span className="text-red-400">(¡cuidado!)</span></span>
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

      {(status === "playing" || status === "hit" || status === "scored" || status === "lost" || status === "won") && (
        <div ref={gameAreaRef} className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Puntos</span>
              <p className="font-display text-2xl text-fifa-gold">{score}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Estadios</span>
              <p className="font-display text-2xl text-foreground">{goals}/16</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-fifa-dark-gray">Vidas</span>
              <p className="font-display text-2xl text-foreground">{"❤️".repeat(lives)}</p>
            </div>
          </div>

          <div
            className="relative overflow-hidden select-none"
            style={{ touchAction: "none", WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="rounded-2xl ring-2 ring-fifa-purple/50"
              style={{ width: canvasWidth, height: canvasHeight, touchAction: "none" }}
            />

            {(status === "lost" || status === "won") && (() => {
              const friends = Array.from(collectedFriends.current)
                .map((idx) => participants[idx])
                .filter(Boolean);
              return status === "lost" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/70 backdrop-blur-sm">
                  <span className="text-4xl">🐸</span>
                  <h3 className="font-display text-2xl uppercase tracking-wider text-fifa-red">Game Over</h3>
                  <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                  <p className="text-xs text-fifa-dark-gray">{goals} {goals === 1 ? "estadio" : "estadios"}</p>
                  {friends.length > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] text-fifa-dark-gray">Llevaste a:</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {friends.map((f) => (
                          <div key={f.name} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                            <AvatarDisplay avatar={f.avatar} size="xs" />
                            <span className="text-[9px] text-foreground">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={start}
                    className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                  >
                    Jugar de nuevo
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/70 backdrop-blur-sm">
                  <span className="text-5xl">🏟️</span>
                  <h3 className="font-display text-xl uppercase tracking-wider text-fifa-gold">¡Recorriste los 16 estadios!</h3>
                  <span className="font-display text-3xl text-fifa-gold">{score} pts</span>
                  {friends.length > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] text-emerald-400">Fuiste al mundial con:</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {friends.map((f) => (
                          <div key={f.name} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                            <AvatarDisplay avatar={f.avatar} size="xs" />
                            <span className="text-[9px] text-foreground">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-emerald-400">¡Completaste el mundial!</p>
                  <button
                    type="button"
                    onClick={start}
                    className="mt-2 rounded-full bg-fifa-blue px-6 py-2.5 font-display text-sm uppercase tracking-wider text-white"
                  >
                    Jugar de nuevo
                  </button>
                </div>
              );
            })()}
          </div>

          {(status === "playing" || status === "hit" || status === "scored") && (
            <>
              <p className="text-[10px] text-fifa-dark-gray/50 hidden md:block">
                Flechas o WASD para moverse
              </p>
              <p className="text-[10px] text-fifa-dark-gray/50 md:hidden">
                Deslizá para moverte · tocá para avanzar
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          🏆 Frogusa
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
