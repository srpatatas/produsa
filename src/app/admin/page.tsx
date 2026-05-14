"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { matches } from "@/data/matches";
import { knockoutMatches, getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { GroupId } from "@/types";
import { cn } from "@/lib/utils";

const groupAccents: Record<string, string> = {
  A: "from-fifa-green to-fifa-teal",
  B: "from-fifa-red to-rose-600",
  C: "from-fifa-blue to-indigo-600",
  D: "from-fifa-purple to-fuchsia-600",
  E: "from-amber-500 to-fifa-gold",
  F: "from-fifa-teal to-cyan-500",
  G: "from-fifa-red to-fifa-purple",
  H: "from-fifa-blue to-fifa-green",
  I: "from-fifa-purple to-fifa-blue",
  J: "from-fifa-green to-lime-500",
  K: "from-fifa-gold to-amber-600",
  L: "from-fifa-red to-fifa-blue",
};

function matchLabel(matchId: string): string {
  const gMatch = matches.find((m) => m.id === matchId);
  if (gMatch) {
    return `${getTeam(gMatch.homeTeamId).shortName} vs ${getTeam(gMatch.awayTeamId).shortName}`;
  }
  const kMatch = knockoutMatches.find((m) => m.id === matchId);
  if (kMatch) {
    return `${kMatch.homeSlot.label} vs ${kMatch.awaySlot.label}`;
  }
  return matchId;
}

interface AdminUser {
  id: number;
  name: string;
  invite_code: string;
  avatar: string;
  is_admin: boolean;
  registered: boolean;
  created_at: string;
}

interface UserPredictions {
  predictions: { match_id: string; outcome: string }[];
  comodines: { scope: string; match_id: string }[];
  bonus: { question_id: string; answer: string }[];
}

interface MatchResultEntry {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export default function AdminPage() {
  const user = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "results">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAvatar, setNewAvatar] = useState("⚽");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPreds, setUserPreds] = useState<UserPredictions | null>(null);

  useEffect(() => {
    if (!user.is_admin) {
      router.push("/");
      return;
    }
    loadUsers();
  }, [user, router]);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, inviteCode: newCode, avatar: newAvatar }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setNewName("");
    setNewCode("");
    setNewAvatar("⚽");
    setShowAdd(false);
    loadUsers();
  };

  const handleResetPin = async (userId: number) => {
    if (!confirm("¿Resetear PIN? El usuario tendrá que registrarse de nuevo.")) return;
    await fetch("/api/admin/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadUsers();
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Se borrarán todas sus predicciones.`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadUsers();
  };

  const handleViewPredictions = async (userId: number) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserPreds(null);
      return;
    }
    setSelectedUser(userId);
    const res = await fetch(`/api/admin/user-predictions?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setUserPreds(data);
    }
  };

  // Results state
  const [dbResults, setDbResults] = useState<Record<string, MatchResultEntry>>({});
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [resultError, setResultError] = useState("");

  const loadResults = async () => {
    const res = await fetch("/api/admin/results");
    if (res.ok) {
      const data = await res.json();
      setDbResults(data.results);
    }
    setResultsLoaded(true);
  };

  useEffect(() => {
    if (tab === "results" && !resultsLoaded) loadResults();
  }, [tab, resultsLoaded]);

  const allGroupMatches = matches.map((m) => ({
    id: m.id,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    group: m.groupId,
    matchday: m.matchday,
  }));

  const [resultSaving, setResultSaving] = useState(false);
  const [resultStatus, setResultStatus] = useState<"idle" | "saved" | "error">("idle");

  const flashStatus = (status: "saved" | "error") => {
    setResultStatus(status);
    setTimeout(() => setResultStatus("idle"), 2500);
  };

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

  if (!user.is_admin) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin
        </h1>
      </div>

      {/* Admin tabs */}
      <div className="mb-6 flex rounded-full bg-surface p-1 ring-1 ring-white/5">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "flex-1 rounded-full px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
            tab === "users"
              ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
              : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10 cursor-pointer",
          )}
        >
          Participantes
        </button>
        <button
          onClick={() => setTab("results")}
          className={cn(
            "flex-1 rounded-full px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
            tab === "results"
              ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
              : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10 cursor-pointer",
          )}
        >
          Resultados
        </button>
      </div>

      {tab === "users" && (
      <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-gradient-to-r from-fifa-purple to-fifa-teal px-4 py-2 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/20 transition-all hover:brightness-110"
        >
          + Agregar participante
        </button>
        <a
          href="/api/admin/export"
          className="rounded-xl bg-white/5 px-4 py-2 font-display text-sm uppercase tracking-wider text-fifa-dark-gray ring-1 ring-white/5 transition-all hover:text-foreground hover:bg-white/10"
        >
          ⬇ Descargar pronósticos
        </a>
      </div>

      {showAdd && (
        <form onSubmit={handleAddUser} className="mb-6 space-y-3 rounded-2xl bg-card-bg p-5 ring-1 ring-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Alias"
              className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40 placeholder:text-fifa-dark-gray/30"
              required
            />
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Usuario (ej: JUAN2026)"
              className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm font-display uppercase tracking-wider text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-fifa-red">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 text-sm text-fifa-dark-gray hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-fifa-purple px-4 py-2 text-sm font-medium text-white"
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-fifa-dark-gray">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}>
              <div className="flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all hover:ring-white/15">
                <div className="flex flex-col items-center gap-1">
                  <AvatarDisplay avatar={u.avatar} size="md" />
                  <label className="cursor-pointer text-[9px] text-fifa-teal hover:text-fifa-teal/80">
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("userId", String(u.id));
                        const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
                        if (res.ok) {
                          const data = await res.json();
                          setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, avatar: data.url } : usr));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {u.name}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-full bg-fifa-purple/20 px-2 py-0.5 text-[9px] font-bold text-fifa-purple">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-fifa-dark-gray">
                    <span className="font-display tracking-wider">{u.invite_code}</span>
                    <span className="text-fifa-dark-gray/30">·</span>
                    <span className={u.registered ? "text-fifa-green" : "text-fifa-gold"}>
                      {u.registered ? "Registrado" : "Pendiente"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPredictions(u.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                      selectedUser === u.id
                        ? "bg-fifa-blue/20 text-fifa-blue ring-1 ring-fifa-blue/30"
                        : "bg-white/5 text-fifa-dark-gray hover:text-foreground hover:bg-white/10",
                    )}
                  >
                    {selectedUser === u.id ? "Ocultar" : "Ver predicciones"}
                  </button>
                  <button
                    onClick={() => handleResetPin(u.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium bg-white/5 text-fifa-dark-gray transition-all hover:text-foreground hover:bg-white/10"
                  >
                    Resetear PIN
                  </button>
                  {!u.is_admin && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium text-fifa-red/50 transition-all hover:bg-fifa-red/10 hover:text-fifa-red"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {selectedUser === u.id && userPreds && (
                <div className="mt-1 ml-14 rounded-xl bg-surface p-4 text-xs">
                  <div className="mb-2 font-semibold text-fifa-dark-gray">
                    Predicciones ({userPreds.predictions.length})
                  </div>
                  {userPreds.predictions.length === 0 ? (
                    <p className="text-fifa-dark-gray/50">Sin predicciones</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {userPreds.predictions.map((p) => (
                        <div
                          key={p.match_id}
                          className="flex items-center gap-2 rounded-lg bg-card-bg px-2.5 py-1.5 ring-1 ring-white/5"
                        >
                          <span className="flex-1 truncate text-foreground">{matchLabel(p.match_id)}</span>
                          <span className={cn(
                            "flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold text-white",
                            p.outcome === "L" ? "bg-fifa-green"
                              : p.outcome === "E" ? "bg-fifa-blue"
                              : p.outcome === "V" ? "bg-fifa-red"
                              : "bg-fifa-purple",
                          )}>
                            {p.outcome}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {userPreds.comodines.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 font-semibold text-fifa-gold">Comodines</div>
                      <div className="space-y-1">
                        {userPreds.comodines.map((c) => (
                          <div key={c.scope} className="flex items-center gap-2 rounded-lg bg-fifa-gold/10 px-3 py-1.5">
                            <span className="text-fifa-gold/70">{c.scope}</span>
                            <span className="text-fifa-gold font-medium">{matchLabel(c.match_id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userPreds.bonus.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 font-semibold text-fifa-teal">Puntos Extra</div>
                      <div className="flex flex-wrap gap-1.5">
                        {userPreds.bonus.map((b) => (
                          <span key={b.question_id} className="rounded-lg bg-fifa-teal/10 px-2 py-1 text-fifa-teal">
                            {b.question_id}: {b.answer}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {tab === "results" && (
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
                    const label = `${km.homeSlot.label} vs ${km.awaySlot.label}`;
                    const result = dbResults[km.id];
                    const isEditing = editingMatch === km.id;

                    return (
                      <div
                        key={km.id}
                        className="flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2 ring-1 ring-white/5 text-sm"
                      >
                        <span className="flex-1 text-foreground">{label}</span>

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
      )}

      {resultStatus !== "idle" && (
        <div className="fixed bottom-28 left-1/2 z-[90] -translate-x-1/2 md:bottom-8">
          <div className={cn(
            "rounded-xl px-4 py-2 text-xs font-medium shadow-xl",
            resultStatus === "saved" ? "bg-fifa-green/90 text-white" : "bg-fifa-red/90 text-white",
          )}>
            {resultStatus === "saved" ? "✓ Guardado" : "✗ Error al guardar"}
          </div>
        </div>
      )}
    </div>
  );
}
