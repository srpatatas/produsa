"use client";

import { useState, useEffect, useCallback } from "react";
import { UnifiedMatch, LiveScore } from "@/types";
import { getLiveUnifiedMatches } from "@/lib/unifiedMatches";
import { LiveScoreboard } from "./LiveScoreboard";
import { PlayerPredictionsList, LivePlayerPrediction } from "./PlayerPredictionsList";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 300000;

export function LiveMatchView({
  onNoLiveMatches,
}: {
  onNoLiveMatches: () => React.ReactNode;
}) {
  const [liveMatches, setLiveMatches] = useState<UnifiedMatch[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [currentScore, setCurrentScore] = useState<LiveScore | undefined>();
  const [scoreStale, setScoreStale] = useState(false);
  const [predictions, setPredictions] = useState<LivePlayerPrediction[]>([]);

  useEffect(() => {
    setLiveMatches(getLiveUnifiedMatches());
    setReady(true);
  }, []);

  const fetchApiScore = useCallback(async (matchId: string) => {
    try {
      const res = await fetch("/api/live-score");
      const data = await res.json();
      const apiScore = data.scores?.[matchId];
      if (apiScore) {
        setCurrentScore({
          matchId,
          homeScore: apiScore.homeScore,
          awayScore: apiScore.awayScore,
          minute: apiScore.minute,
        });
        setScoreStale(false);
        return;
      }
    } catch {
      // API unavailable
    }
    setCurrentScore((prev) => {
      if (prev && prev.homeScore >= 0) {
        setScoreStale(true);
        return prev;
      }
      return { matchId, homeScore: -1, awayScore: -1, minute: 0 };
    });
  }, []);

  const fetchPredictions = useCallback(async (matchId: string) => {
    try {
      const res = await fetch(`/api/live-predictions?matchId=${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (liveMatches.length === 0) return;
    const match = liveMatches[activeIndex];

    fetchApiScore(match.id);
    fetchPredictions(match.id);

    const interval = setInterval(() => fetchApiScore(match.id), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [liveMatches, activeIndex, fetchApiScore, fetchPredictions]);

  if (!ready) return null;
  if (liveMatches.length === 0) return <>{onNoLiveMatches()}</>;

  const match = liveMatches[activeIndex];

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
                  : "bg-surface text-fifa-dark-gray hover:bg-white/10",
              )}
            >
              {m.homeLabel} vs {m.awayLabel}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5">
        <LiveScoreboard match={match} liveScore={currentScore} stale={scoreStale} />
        <PlayerPredictionsList predictions={predictions} liveScore={currentScore} />
      </div>
    </div>
  );
}
