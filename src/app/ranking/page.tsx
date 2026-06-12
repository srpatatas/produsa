"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";

interface RankingEntry {
  user: { id: number; name: string; avatar: string };
  points: number;
  correct: number;
  wrong: number;
  comodinPoints: number;
}

const BIRTHDAYS: Record<string, string> = {
  "Chekoloko": "06-11",
};

function isBirthday(name: string) {
  const mmdd = BIRTHDAYS[name];
  if (!mmdd) return false;
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today === mmdd;
}

export default function RankingPage() {
  const currentUser = useUser();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.ok ? r.json() : { ranking: [] })
      .then((data) => setRanking(data.ranking))
      .catch(() => {})
      .finally(() => setLoading(false));
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
            const isTop3 = i < 3;
            const bday = isBirthday(entry.user.name);

            return (
              <div
                key={entry.user.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200 hover:ring-white/15 hover:shadow-md hover:shadow-black/30 hover:translate-x-1",
                  isCurrentUser && "ring-2 ring-fifa-blue/20",
                  bday && "birthday-row !ring-0",
                )}
              >
                {bday && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-fuchsia-500/30 whitespace-nowrap">
                    🎉 ¡Feliz cumple! 🎉
                  </span>
                )}
                <div className="flex w-8 flex-shrink-0 items-center justify-center">
                  {isTop3 ? (
                    <span className="text-xl">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className="font-display text-lg text-fifa-dark-gray">
                      {i + 1}
                    </span>
                  )}
                </div>

                <AvatarDisplay avatar={entry.user.avatar} size="lg" />

                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.user.name}
                    {bday && <span className="ml-1 birthday-bounce">🎂</span>}
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
