"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UnifiedMatch, LiveScore } from "@/types";
import { NextMatchCountdown } from "./NextMatchCountdown";
import { PredictionCompletionNudge } from "./PredictionCompletionNudge";
import { TodayMatchesList } from "./TodayMatchesList";
import { RecentResults } from "./RecentResults";
import { LiveCarousel } from "@/components/live/LiveCarousel";
import { LiveMiniRanking } from "@/components/live/LiveMiniRanking";
import { clearLiveComodinCaches } from "@/components/live/LiveScoreboard";

const POLL_INTERVAL_MS = 15_000;

interface RecentResult extends UnifiedMatch {
  homeScore: number;
  awayScore: number;
  homePenalty: number | null;
  awayPenalty: number | null;
}

interface DashboardData {
  todayMatches: UnifiedMatch[];
  recentResults: RecentResult[];
  nextMatch: UnifiedMatch | null;
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
  knockoutPredictable?: Record<string, boolean>;
}

export function InicioDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<Record<string, { total: number; completed: number }> | null>(null);
  const [liveMatches, setLiveMatches] = useState<UnifiedMatch[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const [staleIds, setStaleIds] = useState<Set<string>>(new Set());
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [rankingSnapshot, setRankingSnapshot] = useState<{ name: string; position: number; previousPosition: number; totalPoints: number; hasComodinOnActive: boolean }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshDashboard = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
    fetch("/api/prediction-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setPredictionStatus(d.predictionStatus); })
      .catch(() => {});
  }, []);


  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const dashboardRefreshedRef = useRef(false);
  const deployIdRef = useRef<string | null>(null);

  const pollTick = useCallback(async () => {
    let live: UnifiedMatch[] = [];
    try {
      const res = await fetch("/api/live-score");
      if (!res.ok) return;
      const data = await res.json();

      if (data.deployId) {
        if (deployIdRef.current && deployIdRef.current !== data.deployId) {
          window.location.reload();
          return;
        }
        deployIdRef.current = data.deployId;
      }

      live = data.liveMatches ?? [];

      const { scores, finished } = data;

      const finishedSet = new Set<string>(finished ?? []);
      const activeMatches = live.filter((m: UnifiedMatch) => !finishedSet.has(m.id));

      setLiveMatches((prev) => {
        const sameMatches = activeMatches.length === prev.length && activeMatches.every((m: UnifiedMatch, i: number) => m.id === prev[i]?.id);
        if (activeMatches.length === 0 && prev.length > 0) setActiveMatchIndex(0);
        else if (!sameMatches) setActiveMatchIndex((idx) => Math.min(idx, activeMatches.length - 1));
        return activeMatches;
      });

      if (finished?.length && !dashboardRefreshedRef.current) {
        dashboardRefreshedRef.current = true;
        refreshDashboard();
      }

      setLiveScores((prev) => {
        const next = { ...prev };
        const newStale = new Set<string>();
        for (const m of activeMatches) {
          const apiScore = scores?.[m.id];
          if (apiScore) {
            next[m.id] = {
              matchId: m.id,
              homeScore: apiScore.homeScore,
              awayScore: apiScore.awayScore,
              minute: apiScore.minute,
              extra: apiScore.extra,
              status: apiScore.status,
              events: apiScore.events,
            };
          } else if (prev[m.id] && prev[m.id].homeScore >= 0) {
            newStale.add(m.id);
          }
        }
        setStaleIds(newStale);
        return next;
      });
    } catch { /* ignore */ }

    if (live.length === 0) {
      setLiveMatches((prev) => {
        if (prev.length === 0) return prev;
        setActiveMatchIndex(0);
        clearLiveComodinCaches();
        if (!dashboardRefreshedRef.current) {
          dashboardRefreshedRef.current = true;
          refreshDashboard();
        }
        return [];
      });
      dashboardRefreshedRef.current = false;
      return;
    }

  }, [refreshDashboard]);

  useEffect(() => {
    pollTick();
    pollRef.current = setInterval(pollTick, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        pollTick();
        pollRef.current = setInterval(pollTick, POLL_INTERVAL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollTick]);

  const isLive = liveMatches.length > 0;
  const liveMatchIds = new Set(liveMatches.map((m) => m.id));
  const nextMatch = data?.nextMatch ?? null;
  const activeMatch = liveMatches[activeMatchIndex];

  const now = Date.now();
  const todayFiltered = (data?.todayMatches ?? []).filter((m) => {
    if (liveMatchIds.has(m.id)) return false;
    if (new Date(m.kickoff).getTime() <= now) return false;
    if (!isLive && nextMatch && m.id === nextMatch.id) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {data && predictionStatus && (
        <PredictionCompletionNudge
          predictionStatus={predictionStatus}
          locks={data.locks}
          knockoutPredictable={data.knockoutPredictable}
        />
      )}

      {isLive ? (
        <>
          <LiveCarousel
            matches={liveMatches}
            scores={liveScores}
            staleIds={staleIds}
            rankingSnapshot={rankingSnapshot}
            onActiveIndexChange={setActiveMatchIndex}
          />

          {activeMatch && (
            <LiveMiniRanking
              scores={liveScores}
              activeMatchId={activeMatch.id}
              liveMatchIds={liveMatches.map((m) => m.id)}
              onRankingUpdate={setRankingSnapshot}
            />
          )}
        </>
      ) : (
        <NextMatchCountdown serverMatch={nextMatch} />
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
