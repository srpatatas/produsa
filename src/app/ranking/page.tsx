"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";

interface RankingEntry {
  user: { id: number; name: string; avatar: string };
  points: number;
  correct: number;
  wrong: number;
  comodinPoints: number;
  exactScorePoints: number;
}

interface GameBadge {
  emoji: string;
  name: string;
}

const GAME_COLORS: Record<string, string> = {
  "Panic": "text-fifa-purple",
  "Prod-Man": "text-fifa-gold",
  "Viborusa": "text-emerald-400",
  "Produtris": "text-fuchsia-400",
  "Arkanusa": "text-cyan-400",
  "FIFA Invaders": "text-orange-400",
  "Flappy D10S": "text-pink-400",
  "Frogusa": "text-lime-400",
  "Trivia": "text-amber-400",
  "Deal": "text-yellow-400",
  "Triompy": "text-blue-400",
};

const GAMES = [
  { api: "/api/panic", emoji: "😱", name: "Panic" },
  { api: "/api/prodman", emoji: "👻", name: "Prod-Man" },
  { api: "/api/snake", emoji: "🐍", name: "Viborusa" },
  { api: "/api/tetris", emoji: "🧱", name: "Produtris" },
  { api: "/api/arkanoid", emoji: "🏓", name: "Arkanusa" },
  { api: "/api/invaders", emoji: "👾", name: "FIFA Invaders" },
  { api: "/api/flappy", emoji: "⚽", name: "Flappy D10S" },
  { api: "/api/frogusa", emoji: "🐸", name: "Frogusa" },
  { api: "/api/trivia", emoji: "💰", name: "Trivia" },
  { api: "/api/deal", emoji: "💼", name: "Deal" },
  { api: "/api/triompy", emoji: "🏀", name: "Triompy" },
];

interface BirthdayInfo {
  date: string;
  milestone?: string;
  customBanner?: string;
}

const BIRTHDAYS: Record<number, BirthdayInfo> = {
  24: { date: "06-11" }, // Chekoloko
  2: { date: "06-13", milestone: "40", customBanner: "¡Felices 40, Poeta!" },
  22: { date: "06-29" }, // La Tia de todos
};

function getBirthday(userId: number): BirthdayInfo | null {
  const info = BIRTHDAYS[userId];
  if (!info) return null;
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today === info.date ? info : null;
}

export default function RankingPage() {
  const currentUser = useUser();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameLeaders, setGameLeaders] = useState<Map<number, GameBadge[]>>(new Map());

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.ok ? r.json() : { ranking: [] })
      .then((data) => setRanking(data.ranking))
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all(
      GAMES.map((g) =>
        fetch(g.api)
          .then((r) => r.ok ? r.json() : { leaderboard: [] })
          .then((d) => {
            const top = d.leaderboard?.[0];
            return top ? { userId: top.userId as number, emoji: g.emoji, name: g.name } : null;
          })
          .catch(() => null)
      )
    ).then((results) => {
      const map = new Map<number, GameBadge[]>();
      for (const r of results) {
        if (!r) continue;
        const existing = map.get(r.userId) || [];
        existing.push({ emoji: r.emoji, name: r.name });
        map.set(r.userId, existing);
      }
      setGameLeaders(map);
    });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Posiciones
        </h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">
          Tabla parcial de posiciones. Los puntos extra se suman al final del juego.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-fifa-dark-gray">Cargando...</span>
        </div>
      ) : ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-3 text-4xl">🏆</span>
          <p className="text-fifa-dark-gray">
            El ranking aparecerá cuando haya resultados
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ranking.map((entry, i) => {
            const isCurrentUser = entry.user.id === currentUser.id;
            // Compute real position (ties share same position)
            const realPosition = ranking.filter((e, j) => j < i && e.points > entry.points).length + 1;
            const isTop3 = realPosition <= 3;
            const is10th = realPosition === 10;
            const bdayInfo = getBirthday(entry.user.id);
            const bday = !!bdayInfo;
            const milestone = bdayInfo?.milestone;
            const bannerText = bdayInfo?.customBanner || "¡Feliz cumple!";

            const confettiColors = ["#f43f5e", "#fbbf24", "#4ade80", "#6381f5", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

            return (
              <div
                key={entry.user.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200 hover:ring-white/15 hover:shadow-md hover:shadow-black/30 hover:translate-x-1",
                  isCurrentUser && "ring-2 ring-fifa-blue/20",
                  bday && "birthday-row !ring-0",
                  is10th && "newells-row !ring-0 !shadow-none !transition-none",
                )}
              >
                {bday && milestone && (
                  <div className="birthday-confetti">
                    {Array.from({ length: 20 }).map((_, j) => (
                      <span
                        key={j}
                        style={{
                          left: `${5 + (j * 47) % 90}%`,
                          top: `${-5 + (j * 13) % 10}%`,
                          backgroundColor: confettiColors[j % confettiColors.length],
                          animationDuration: `${1.5 + (j % 5) * 0.3}s`,
                          animationDelay: `${(j % 7) * 0.2}s`,
                          animationIterationCount: "infinite",
                          borderRadius: j % 3 === 0 ? "50%" : "1px",
                          width: j % 4 === 0 ? "4px" : "6px",
                          height: j % 4 === 0 ? "4px" : "6px",
                        }}
                      />
                    ))}
                  </div>
                )}
                {bday && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-fuchsia-500/30 whitespace-nowrap">
                    🎉 {bannerText} 🎉
                  </span>
                )}
                {is10th && (
                  <div className="absolute -left-1 -top-1 h-8 w-8 rounded-full overflow-hidden ring-2 ring-red-700 z-10">
                    <Image src="/images/avatar_loco.png" alt="Loco Dalla Libera" fill className="object-cover" />
                  </div>
                )}
                {is10th && (
                  <div className="absolute -right-1 -top-1 h-8 w-8 rounded-full overflow-hidden ring-2 ring-red-700 z-10">
                    <Image src="/images/avatar_loco2.png" alt="Loco Dalla Libera" fill className="object-cover" />
                  </div>
                )}
                <div className="flex w-8 flex-shrink-0 items-center justify-center">
                  {isTop3 ? (
                    <span className="text-xl">
                      {realPosition === 1 ? "🥇" : realPosition === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className={cn("font-display text-lg", is10th ? "text-red-500 font-bold" : "text-fifa-dark-gray")}>
                      {realPosition}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <AvatarDisplay avatar={entry.user.avatar} size="lg" />
                  {bday && milestone && (
                    <span className="absolute -top-2 -right-2 text-sm">👑</span>
                  )}
                </div>

                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.user.name}
                    {bday && !milestone && <span className="ml-1 birthday-bounce">🎂</span>}
                    {bday && milestone && <span className="ml-1.5 rounded-full bg-gradient-to-r from-fifa-gold to-amber-400 px-1.5 py-px text-[9px] font-bold text-black birthday-bounce">{milestone}</span>}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs font-normal text-fifa-dark-gray">
                        (vos)
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-x-2 gap-y-0 text-[11px] text-fifa-dark-gray">
                    <span>{entry.correct} aciertos</span>
                    <span>{entry.wrong} fallos</span>
                    {entry.comodinPoints > 0 && (
                      <span className="text-fifa-gold">+{entry.comodinPoints} comodín</span>
                    )}
                    {entry.exactScorePoints > 0 && (
                      <span className="text-emerald-400">+{entry.exactScorePoints} exacto</span>
                    )}
                    {(gameLeaders.get(entry.user.id) || []).map((badge) => (
                      <span key={badge.name} className={GAME_COLORS[badge.name] || "text-fifa-purple"}>{badge.emoji} {badge.name}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-col items-end">
                  <span className="font-display text-3xl text-foreground">
                    {entry.points}
                  </span>
                  <span className="text-[10px] font-medium text-fifa-dark-gray">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
