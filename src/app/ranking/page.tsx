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
          Ranking
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          Tabla de posiciones entre los jugadores
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

            return (
              <div
                key={entry.user.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200 hover:ring-white/15 hover:shadow-md hover:shadow-black/30 hover:translate-x-1",
                  isCurrentUser && "ring-2 ring-fifa-blue/20",
                )}
              >
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

                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {entry.user.name}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs font-normal text-fifa-dark-gray">
                        (vos)
                      </span>
                    )}
                  </span>
                  <div className="flex gap-3 text-[11px] text-fifa-dark-gray">
                    <span>{entry.correct} aciertos</span>
                    <span className="text-fifa-dark-gray/30">·</span>
                    <span>{entry.wrong} fallos</span>
                    {entry.comodinPoints > 0 && (
                      <>
                        <span className="text-fifa-dark-gray/30">·</span>
                        <span className="text-fifa-gold">+{entry.comodinPoints} comodín</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
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
