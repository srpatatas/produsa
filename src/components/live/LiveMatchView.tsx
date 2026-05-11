"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types";
import { getLiveMatches } from "@/data/matches";
import { getLiveScore, LiveScore } from "@/data/liveScores";
import { getPlayerPredictions } from "@/data/playerPredictions";
import { LiveScoreboard } from "./LiveScoreboard";
import { PlayerPredictionsList } from "./PlayerPredictionsList";
import { cn } from "@/lib/utils";

export function LiveMatchView({
  onNoLiveMatches,
}: {
  onNoLiveMatches: () => React.ReactNode;
}) {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [currentScore, setCurrentScore] = useState<LiveScore | undefined>();

  useEffect(() => {
    setLiveMatches(getLiveMatches());
    setReady(true);
  }, []);

  useEffect(() => {
    if (liveMatches.length === 0) return;
    const match = liveMatches[activeIndex];

    const update = () => setCurrentScore(getLiveScore(match.id));
    update();

    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [liveMatches, activeIndex]);

  if (!ready) return null;
  if (liveMatches.length === 0) return <>{onNoLiveMatches()}</>;

  const match = liveMatches[activeIndex];
  const predictions = getPlayerPredictions(match.id);

  if (!currentScore) return <>{onNoLiveMatches()}</>;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          En vivo
        </h1>
        {liveMatches.length > 1 && (
          <p className="mt-1 text-sm text-fifa-dark-gray">
            {liveMatches.length} partidos en juego
          </p>
        )}
      </div>

      {liveMatches.length > 1 && (
        <div className="mb-4 flex gap-2">
          {liveMatches.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                i === activeIndex
                  ? "bg-fifa-blue text-white"
                  : "bg-surface text-fifa-dark-gray hover:bg-fifa-light-gray",
              )}
            >
              {m.homeTeamId} vs {m.awayTeamId}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5">
        <LiveScoreboard match={match} liveScore={currentScore} />
        <PlayerPredictionsList predictions={predictions} liveScore={currentScore} />
      </div>
    </div>
  );
}
