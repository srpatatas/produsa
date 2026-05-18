"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UnifiedMatch, LiveScore } from "@/types";
import { getLiveUnifiedMatches, getNextUnifiedMatch } from "@/lib/unifiedMatches";
import { NextMatchCountdown } from "./NextMatchCountdown";
import { PredictionCompletionNudge } from "./PredictionCompletionNudge";
import { TodayMatchesList } from "./TodayMatchesList";
import { RecentResults } from "./RecentResults";
import { LiveCarousel } from "@/components/live/LiveCarousel";
import { LiveMiniRanking } from "@/components/live/LiveMiniRanking";

const POLL_INTERVAL_MS = 300_000;

interface RecentResult extends UnifiedMatch {
  homeScore: number;
  awayScore: number;
}

interface DashboardData {
  todayMatches: UnifiedMatch[];
  recentResults: RecentResult[];
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
  predictionStatus: Record<string, { total: number; completed: number }>;
}

export function InicioDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [liveMatches, setLiveMatches] = useState<UnifiedMatch[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const [staleIds, setStaleIds] = useState<Set<string>>(new Set());
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {});

    setLiveMatches(getLiveUnifiedMatches());
  }, []);

  const fetchLiveScores = useCallback(async () => {
    try {
      const res = await fetch("/api/live-score");
      if (!res.ok) return;
      const { scores, finished } = await res.json();

      if (finished?.length) {
        setLiveMatches((prev) => {
          const finishedSet = new Set<string>(finished);
          const next = prev.filter((m) => !finishedSet.has(m.id));
          if (next.length === 0) setActiveMatchIndex(0);
          else setActiveMatchIndex((i) => Math.min(i, next.length - 1));
          return next;
        });
      }

      setLiveScores((prev) => {
        const next = { ...prev };
        const newStale = new Set<string>();

        for (const m of getLiveUnifiedMatches()) {
          const apiScore = scores?.[m.id];
          if (apiScore) {
            next[m.id] = {
              matchId: m.id,
              homeScore: apiScore.homeScore,
              awayScore: apiScore.awayScore,
              minute: apiScore.minute,
            };
          } else if (prev[m.id] && prev[m.id].homeScore >= 0) {
            newStale.add(m.id);
          } else {
            next[m.id] = { matchId: m.id, homeScore: -1, awayScore: -1, minute: 0 };
          }
        }

        setStaleIds(newStale);
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (liveMatches.length === 0) return;

    fetchLiveScores();
    pollRef.current = setInterval(fetchLiveScores, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [liveMatches.length, fetchLiveScores]);

  const isLive = liveMatches.length > 0;
  const liveMatchIds = new Set(liveMatches.map((m) => m.id));
  const nextMatch = getNextUnifiedMatch();
  const activeMatch = liveMatches[activeMatchIndex];

  const todayFiltered = (data?.todayMatches ?? []).filter((m) => {
    if (liveMatchIds.has(m.id)) return false;
    if (!isLive && nextMatch && m.id === nextMatch.id) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {data && (
        <PredictionCompletionNudge
          predictionStatus={data.predictionStatus}
          locks={data.locks}
        />
      )}

      {isLive ? (
        <>
          <LiveCarousel
            matches={liveMatches}
            scores={liveScores}
            staleIds={staleIds}
            onActiveIndexChange={setActiveMatchIndex}
          />

          {activeMatch && Object.keys(liveScores).length > 0 && (
            <LiveMiniRanking
              scores={liveScores}
              activeMatchId={activeMatch.id}
            />
          )}
        </>
      ) : (
        <NextMatchCountdown />
      )}

      {data && (
        <>
          <TodayMatchesList
            matches={todayFiltered}
            locks={data.locks}
          />

          <RecentResults results={data.recentResults} />
        </>
      )}
    </div>
  );
}
