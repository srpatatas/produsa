"use client";

import { useState, useEffect } from "react";
import { matches } from "@/data/matches";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { cn } from "@/lib/utils";
import { groupAccents } from "./types";

interface AdminMatchSettingsTabProps {
  flashStatus: (status: "saved" | "error") => void;
}

export function AdminMatchSettingsTab({ flashStatus }: AdminMatchSettingsTabProps) {
  const [matchSettings, setMatchSettings] = useState<Record<string, { comodinAllowed: boolean; exactScore: boolean }>>({});
  const [matchSettingsLoaded, setMatchSettingsLoaded] = useState(false);
  const [settingSaving, setSettingSaving] = useState<string | null>(null);
  const [resolvedTeams, setResolvedTeams] = useState<Record<string, { homeTeamId: string | null; awayTeamId: string | null }>>({});

  const loadMatchSettings = async () => {
    const res = await fetch("/api/admin/match-settings");
    if (res.ok) {
      const data = await res.json();
      setMatchSettings(data.settings);
    }
    setMatchSettingsLoaded(true);
  };

  useEffect(() => {
    if (!matchSettingsLoaded) loadMatchSettings();
    fetch("/api/knockout-matches")
      .then((r) => r.ok ? r.json() : { matches: [] })
      .then((data) => {
        const map: Record<string, { homeTeamId: string | null; awayTeamId: string | null }> = {};
        for (const m of data.matches) map[m.id] = { homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId };
        setResolvedTeams(map);
      })
      .catch(() => {});
  }, [matchSettingsLoaded]);

  const handleToggleSetting = async (matchId: string, field: "comodinAllowed" | "exactScore") => {
    const current = matchSettings[matchId] ?? { comodinAllowed: false, exactScore: false };
    const updated = { ...current, [field]: !current[field] };

    // Exact and comodín can't be on the same match
    if (field === "exactScore" && updated.exactScore) updated.comodinAllowed = false;
    if (field === "comodinAllowed" && updated.comodinAllowed) updated.exactScore = false;

    setSettingSaving(matchId);
    try {
      const res = await fetch("/api/admin/match-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, comodinAllowed: updated.comodinAllowed, exactScore: updated.exactScore }),
      });
      if (res.ok) {
        // If exactScore was toggled on, reload all to reflect the "one per fecha" constraint
        if (field === "exactScore" && updated.exactScore) {
          await loadMatchSettings();
        } else {
          setMatchSettings((prev) => ({ ...prev, [matchId]: updated }));
        }
        flashStatus("saved");
      } else {
        flashStatus("error");
      }
    } catch {
      flashStatus("error");
    } finally {
      setSettingSaving(null);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-fifa-dark-gray">
        Elegí qué partidos permiten comodín y cuál tiene resultado exacto (+2 pts) por fecha
      </p>

      {[1, 2, 3].map((fecha) => {
        const fechaMatches = matches.filter((m) => m.matchday === fecha);
        const comodinCount = fechaMatches.filter((m) => matchSettings[m.id]?.comodinAllowed).length;
        const exactMatch = fechaMatches.find((m) => matchSettings[m.id]?.exactScore);

        return (
          <div key={fecha} className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                Fecha {fecha}
              </h3>
              <span className="text-xs text-fifa-dark-gray">
                {comodinCount} con comodín
                {exactMatch ? ` · Exacto: ${getTeam(exactMatch.homeTeamId).shortName} vs ${getTeam(exactMatch.awayTeamId).shortName}` : " · Sin resultado exacto"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((groupId) => {
                const groupMatches = fechaMatches.filter((m) => m.groupId === groupId);
                if (groupMatches.length === 0) return null;

                return (
                  <div key={groupId}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${groupAccents[groupId] || ""}`} />
                      <span className="font-display text-sm tracking-wider text-fifa-dark-gray">
                        GRUPO {groupId}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {groupMatches.map((m) => {
                        const setting = matchSettings[m.id] ?? { comodinAllowed: false, exactScore: false };
                        const isSaving = settingSaving === m.id;
                        const home = getTeam(m.homeTeamId);
                        const away = getTeam(m.awayTeamId);

                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "flex items-center gap-2 rounded-xl bg-card-bg px-2.5 py-2 ring-1 transition-all",
                              setting.exactScore ? "ring-fifa-gold/30 bg-fifa-gold/[0.03]" : "ring-white/5",
                              isSaving && "opacity-50",
                            )}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <FlagImage code={home.flagCode} name={home.name} size="sm" />
                              <span className="font-display text-xs tracking-wider">{home.shortName}</span>
                              <span className="text-fifa-dark-gray/40 text-[10px]">vs</span>
                              <span className="font-display text-xs tracking-wider">{away.shortName}</span>
                              <FlagImage code={away.flagCode} name={away.name} size="sm" />
                            </div>

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={setting.comodinAllowed}
                                onChange={() => handleToggleSetting(m.id, "comodinAllowed")}
                                disabled={isSaving}
                                className="h-3.5 w-3.5 rounded accent-fifa-teal"
                              />
                              <span className="text-[10px] text-fifa-dark-gray">Comodín</span>
                            </label>

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={setting.exactScore}
                                onChange={() => handleToggleSetting(m.id, "exactScore")}
                                disabled={isSaving}
                                className="h-3.5 w-3.5 rounded accent-fifa-gold"
                              />
                              <span className="text-[10px] text-fifa-gold">Exacto</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <h2 className="mt-8 mb-4 font-display text-lg uppercase tracking-wider text-fifa-purple">Eliminatorias</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {knockoutRounds.map((round) => {
        const koMatches = getKnockoutMatchesByRound(round.id);
        const comodinCount = koMatches.filter((m) => matchSettings[m.id]?.comodinAllowed).length;
        const exactMatch = koMatches.find((m) => matchSettings[m.id]?.exactScore);

        return (
          <div key={round.id}>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-fifa-purple to-fifa-teal" />
              <span className="font-display text-sm tracking-wider text-fifa-dark-gray">
                {round.label}
              </span>
              <span className="text-[10px] text-fifa-dark-gray/50">
                {comodinCount} comodín{exactMatch ? " · 1 exacto" : ""}
              </span>
            </div>

            <div className="space-y-1">
              {koMatches.map((km) => {
                const setting = matchSettings[km.id] ?? { comodinAllowed: false, exactScore: false };
                const isSaving = settingSaving === km.id;
                const resolved = resolvedTeams[km.id];
                const homeTeam = resolved?.homeTeamId ? getTeam(resolved.homeTeamId) : null;
                const awayTeam = resolved?.awayTeamId ? getTeam(resolved.awayTeamId) : null;

                return (
                  <div
                    key={km.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl bg-card-bg px-2.5 py-2 ring-1 transition-all text-xs",
                      setting.exactScore ? "ring-fifa-gold/30 bg-fifa-gold/[0.03]" : "ring-white/5",
                      isSaving && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {homeTeam ? (
                        <>
                          <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="sm" />
                          <span className="font-display text-xs tracking-wider">{homeTeam.shortName}</span>
                        </>
                      ) : (
                        <span className="text-fifa-dark-gray/60 text-[10px] truncate">{km.homeSlot.label}</span>
                      )}
                      <span className="text-fifa-dark-gray/40 text-[10px]">vs</span>
                      {awayTeam ? (
                        <>
                          <span className="font-display text-xs tracking-wider">{awayTeam.shortName}</span>
                          <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="sm" />
                        </>
                      ) : (
                        <span className="text-fifa-dark-gray/60 text-[10px] truncate">{km.awaySlot.label}</span>
                      )}
                    </div>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.comodinAllowed}
                        onChange={() => handleToggleSetting(km.id, "comodinAllowed")}
                        disabled={isSaving}
                        className="h-3.5 w-3.5 rounded accent-fifa-teal"
                      />
                      <span className="text-[10px] text-fifa-dark-gray">Comodín</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.exactScore}
                        onChange={() => handleToggleSetting(km.id, "exactScore")}
                        disabled={isSaving}
                        className="h-3.5 w-3.5 rounded accent-fifa-gold"
                      />
                      <span className="text-[10px] text-fifa-gold">Exacto</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
