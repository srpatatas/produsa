"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LiveScore } from "@/types";
import { useUser } from "@/context/UserContext";
import { getAllUnifiedMatches } from "@/lib/unifiedMatches";
import { LiveMiniRankingRow } from "./LiveMiniRankingRow";

interface RankingEntry {
  user: { id: number; name: string; avatar: string };
  confirmedPoints: number;
  livePoints: number;
  totalPoints: number;
  livePredictions: Record<string, string>;
  liveExactScores: Record<string, { home: number; away: number }>;
  liveComodinMatchId: string | null;
  position: number;
  previousPosition: number;
}

export interface RankingSnapshot {
  name: string;
  position: number;
  previousPosition: number;
  totalPoints: number;
  hasComodinOnActive: boolean;
}

interface LiveMiniRankingProps {
  scores: Record<string, LiveScore>;
  activeMatchId: string;
  liveMatchIds: string[];
  onRankingUpdate?: (snapshot: RankingSnapshot[]) => void;
}

function scoreFingerprint(scores: Record<string, LiveScore>, ids: string[]): string {
  return ids.map((id) => {
    const s = scores[id];
    return s ? `${id}:${s.homeScore}-${s.awayScore}-${s.status}` : `${id}:-`;
  }).join("|");
}

export function LiveMiniRanking({ scores, activeMatchId, liveMatchIds, onRankingUpdate }: LiveMiniRankingProps) {
  const currentUser = useUser();
  const scope = useMemo(() => {
    const match = getAllUnifiedMatches().find((m) => m.id === activeMatchId);
    return match?.scope ?? "fecha-1";
  }, [activeMatchId]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const prevFingerprintRef = useRef("");

  const fingerprint = scoreFingerprint(scores, liveMatchIds);

  const fetchRanking = useCallback(async () => {
    const scoreParams = liveMatchIds.map((id) => {
      const s = scores[id];
      return s && s.homeScore >= 0
        ? { matchId: id, homeScore: s.homeScore, awayScore: s.awayScore }
        : { matchId: id, homeScore: -1, awayScore: -1 };
    });

    if (scoreParams.length === 0) return;

    try {
      const res = await fetch(
        `/api/live-ranking?scores=${encodeURIComponent(JSON.stringify(scoreParams))}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRanking(data.ranking);
        onRankingUpdate?.(data.ranking.map((e: RankingEntry) => ({
          name: e.user.name,
          position: e.position,
          previousPosition: e.previousPosition,
          totalPoints: e.totalPoints,
          hasComodinOnActive: e.liveComodinMatchId === activeMatchId,
        })));
      }
    } catch {}
    setLoading(false);
  }, [scores, liveMatchIds]);

  useEffect(() => {
    if (fingerprint !== prevFingerprintRef.current) {
      prevFingerprintRef.current = fingerprint;
      fetchRanking();
    }
  }, [fingerprint, fetchRanking]);

  if (loading || ranking.length === 0) return null;

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
        Posiciones en vivo
      </h2>

      <div className="space-y-1">
        {ranking.map((entry) => (
          <LiveMiniRankingRow
            key={entry.user.id}
            position={entry.position}
            previousPosition={entry.previousPosition}
            user={entry.user}
            prediction={entry.livePredictions[activeMatchId]}
            exactScore={entry.liveExactScores[activeMatchId]}
            confirmedPoints={entry.confirmedPoints}
            livePoints={entry.livePoints}
            totalPoints={entry.totalPoints}
            isCurrentUser={entry.user.id === currentUser.id}
            hasComodin={entry.liveComodinMatchId === activeMatchId}
            scope={scope}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[9px] text-fifa-dark-gray/40">
        {Object.values(scores).some((s) => s.homeScore >= 0)
          ? "Proyección si se mantiene el resultado actual"
          : "Pronósticos de cada participante"}
      </p>
    </div>
  );
}
