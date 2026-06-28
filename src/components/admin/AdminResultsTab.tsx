"use client";

import { useState, useEffect } from "react";
import { matches } from "@/data/matches";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { cn } from "@/lib/utils";
import { groupAccents } from "./types";
import type { MatchResultEntry } from "./types";

interface AdminResultsTabProps {
  flashStatus: (status: "saved" | "error") => void;
}

export function AdminResultsTab({ flashStatus }: AdminResultsTabProps) {
  const [dbResults, setDbResults] = useState<Record<string, MatchResultEntry>>({});
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [resultError, setResultError] = useState("");
  const [resultSaving, setResultSaving] = useState(false);
  const [resolvedTeams, setResolvedTeams] = useState<Record<string, { homeTeamId: string | null; awayTeamId: string | null }>>({});

  const loadResults = async () => {
    const res = await fetch("/api/admin/results");
    if (res.ok) {
      const data = await res.json();
      setDbResults(data.results);
    }
    setResultsLoaded(true);
  };

  useEffect(() => {
    if (!resultsLoaded) loadResults();
    fetch("/api/knockout-matches")
      .then((r) => r.ok ? r.json() : { matches: [] })
      .then((data) => {
        const map: Record<string, { homeTeamId: string | null; awayTeamId: string | null }> = {};
        for (const m of data.matches) map[m.id] = { homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId };
        setResolvedTeams(map);
      })
      .catch(() => {});
  }, [resultsLoaded]);

  const allGroupMatches = matches.map((m) => ({
    id: m.id,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    group: m.groupId,
    matchday: m.matchday,
  }));

  const handleSaveResult = async (matchId: string) => {
    setResultError("");
    const homeScore = parseInt(editHome, 10);
    const awayScore = parseInt(editAway, 10);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      setResultError("Scores inválidos");
      return;
    }
    setResultSaving(true);
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      });
      if (res.ok) {
        setDbResults((prev) => ({ ...prev, [matchId]: { matchId, homeScore, awayScore } }));
        setEditingMatch(null);
        flashStatus("saved");
      } else {
        setResultError("Error al guardar");
        flashStatus("error");
      }
    } catch {
      setResultError("Error de conexión");
      flashStatus("error");
    } finally {
      setResultSaving(false);
    }
  };

  const handleDeleteResult = async (matchId: string) => {
    if (!confirm("¿Eliminar este resultado?")) return;
    setResultSaving(true);
    try {
      const res = await fetch("/api/admin/results", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        setDbResults((prev) => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        flashStatus("saved");
      } else {
        flashStatus("error");
      }
    } catch {
      flashStatus("error");
    } finally {
      setResultSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-fifa-dark-gray">
        {Object.keys(dbResults).length} resultados cargados
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((groupId) => {
        const groupMatches = allGroupMatches.filter((m) => m.group === groupId);
        return (
          <div key={groupId}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${groupAccents[groupId] || ""}`} />
              <span className="font-display text-base tracking-wider text-fifa-dark-gray">
                GRUPO
              </span>
              <span className="font-title text-xl text-foreground">{groupId}</span>
            </div>
            <div className="space-y-1.5">
              {groupMatches.map((m) => {
                const result = dbResults[m.id];
                const isEditing = editingMatch === m.id;

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2.5 ring-1 ring-white/5 text-sm"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <FlagImage code={getTeam(m.homeTeamId).flagCode} name={getTeam(m.homeTeamId).name} size="sm" />
                      <span className="font-display text-xs tracking-wider">{getTeam(m.homeTeamId).shortName}</span>
                      <span className="text-fifa-dark-gray/40">vs</span>
                      <span className="font-display text-xs tracking-wider">{getTeam(m.awayTeamId).shortName}</span>
                      <FlagImage code={getTeam(m.awayTeamId).flagCode} name={getTeam(m.awayTeamId).name} size="sm" />
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={editHome}
                          onChange={(e) => setEditHome(e.target.value)}
                          className="w-12 rounded-lg bg-surface px-2 py-1 text-center text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40"
                        />
                        <span className="text-fifa-dark-gray">:</span>
                        <input
                          type="number"
                          min={0}
                          value={editAway}
                          onChange={(e) => setEditAway(e.target.value)}
                          className="w-12 rounded-lg bg-surface px-2 py-1 text-center text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40"
                        />
                        <button
                          onClick={() => handleSaveResult(m.id)}
                          className="rounded-lg bg-fifa-green/20 px-2 py-1 text-xs text-fifa-green hover:bg-fifa-green/30"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingMatch(null)}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:text-foreground"
                        >
                          ✗
                        </button>
                      </div>
                    ) : result ? (
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base text-foreground">
                          {result.homeScore} : {result.awayScore}
                        </span>
                        <button
                          onClick={() => { setEditingMatch(m.id); setEditHome(String(result.homeScore)); setEditAway(String(result.awayScore)); }}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:bg-white/5 hover:text-foreground"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteResult(m.id)}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-red/50 hover:text-fifa-red"
                        >
                          Borrar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingMatch(m.id); setEditHome(""); setEditAway(""); }}
                        className="rounded-lg bg-white/5 px-3 py-1 text-xs text-fifa-dark-gray hover:text-foreground hover:bg-white/10"
                      >
                        + Cargar resultado
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      </div>

      <h2 className="mt-8 mb-4 font-display text-lg uppercase tracking-wider text-fifa-purple">Eliminatorias</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {knockoutRounds.map((round) => {
        const koMatches = getKnockoutMatchesByRound(round.id);
        return (
          <div key={round.id}>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-fifa-purple to-fifa-teal" />
              <span className="font-display text-base tracking-wider text-fifa-dark-gray">
                {round.label}
              </span>
            </div>
            <div className="space-y-1.5">
              {koMatches.map((km) => {
                const resolved = resolvedTeams[km.id];
                const homeTeam = resolved?.homeTeamId ? getTeam(resolved.homeTeamId) : null;
                const awayTeam = resolved?.awayTeamId ? getTeam(resolved.awayTeamId) : null;
                const result = dbResults[km.id];
                const isEditing = editingMatch === km.id;

                return (
                  <div
                    key={km.id}
                    className="flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2 ring-1 ring-white/5 text-sm"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {homeTeam ? (
                        <>
                          <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="sm" />
                          <span className="font-display text-xs tracking-wider">{homeTeam.shortName}</span>
                        </>
                      ) : (
                        <span className="text-fifa-dark-gray/60 text-xs truncate">{km.homeSlot.label}</span>
                      )}
                      <span className="text-fifa-dark-gray/40">vs</span>
                      {awayTeam ? (
                        <>
                          <span className="font-display text-xs tracking-wider">{awayTeam.shortName}</span>
                          <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="sm" />
                        </>
                      ) : (
                        <span className="text-fifa-dark-gray/60 text-xs truncate">{km.awaySlot.label}</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={editHome}
                          onChange={(e) => setEditHome(e.target.value)}
                          className="w-12 rounded-lg bg-surface px-2 py-1 text-center text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40"
                        />
                        <span className="text-fifa-dark-gray">:</span>
                        <input
                          type="number"
                          min={0}
                          value={editAway}
                          onChange={(e) => setEditAway(e.target.value)}
                          className="w-12 rounded-lg bg-surface px-2 py-1 text-center text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40"
                        />
                        <button
                          onClick={() => handleSaveResult(km.id)}
                          className="rounded-lg bg-fifa-green/20 px-2 py-1 text-xs text-fifa-green hover:bg-fifa-green/30"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingMatch(null)}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:text-foreground"
                        >
                          ✗
                        </button>
                      </div>
                    ) : result ? (
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base text-foreground">
                          {result.homeScore} : {result.awayScore}
                        </span>
                        <button
                          onClick={() => { setEditingMatch(km.id); setEditHome(String(result.homeScore)); setEditAway(String(result.awayScore)); }}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:bg-white/5 hover:text-foreground"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteResult(km.id)}
                          className="rounded-lg px-2 py-1 text-xs text-fifa-red/50 hover:text-fifa-red"
                        >
                          Borrar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingMatch(km.id); setEditHome(""); setEditAway(""); }}
                        className="rounded-lg bg-white/5 px-3 py-1 text-xs text-fifa-dark-gray hover:text-foreground hover:bg-white/10"
                      >
                        + Cargar resultado
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      </div>

      {resultError && (
        <p className="mt-2 text-sm text-fifa-red">{resultError}</p>
      )}
    </div>
  );
}
