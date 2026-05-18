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
  const [tab, setTab] = useState<"users" | "matches" | "results" | "bonus">("users");
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

  // Match settings state
  const [matchSettings, setMatchSettings] = useState<Record<string, { comodinAllowed: boolean; exactScore: boolean }>>({});
  const [matchSettingsLoaded, setMatchSettingsLoaded] = useState(false);
  const [settingSaving, setSettingSaving] = useState<string | null>(null);

  const loadMatchSettings = async () => {
    const res = await fetch("/api/admin/match-settings");
    if (res.ok) {
      const data = await res.json();
      setMatchSettings(data.settings);
    }
    setMatchSettingsLoaded(true);
  };

  useEffect(() => {
    if (tab === "matches" && !matchSettingsLoaded) loadMatchSettings();
  }, [tab, matchSettingsLoaded]);

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

  // Bonus results state
  const [bonusResults, setBonusResults] = useState<Record<string, { correctAnswer: string; points: number }>>({});
  const [bonusLoaded, setBonusLoaded] = useState(false);
  const [bonusEdits, setBonusEdits] = useState<Record<string, { answer: string; points: string }>>({});
  const [bonusPointsOverride, setBonusPointsOverride] = useState<Record<string, number>>({});
  const [bonusSaving, setBonusSaving] = useState<string | null>(null);

  const [bonusQuestions, setBonusQuestions] = useState<{ id: string; label: string; sourceType: string; lockScope: string }[]>([]);
  const [bonusQuestionsLoaded, setBonusQuestionsLoaded] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [questionEdit, setQuestionEdit] = useState<{ label: string; sourceType: string; lockScope: string }>({ label: "", sourceType: "teams", lockScope: "fecha-1" });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{ id: string; label: string; sourceType: string; lockScope: string }>({ id: "", label: "", sourceType: "teams", lockScope: "fecha-1" });

  const loadBonusQuestions = async () => {
    const res = await fetch("/api/admin/bonus-questions");
    if (res.ok) {
      const data = await res.json();
      setBonusQuestions(data.questions);
    }
    setBonusQuestionsLoaded(true);
  };

  const handleSaveQuestion = async (id: string) => {
    try {
      const res = await fetch("/api/admin/bonus-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...questionEdit }),
      });
      if (res.ok) {
        setBonusQuestions((prev) => prev.map((q) => q.id === id ? { ...q, ...questionEdit } : q));
        setEditingQuestion(null);
        flashStatus("saved");
      } else { flashStatus("error"); }
    } catch { flashStatus("error"); }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.id || !newQuestion.label) return;
    try {
      const res = await fetch("/api/admin/bonus-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        await loadBonusQuestions();
        setShowAddQuestion(false);
        setNewQuestion({ id: "", label: "", sourceType: "teams", lockScope: "fecha-1" });
        flashStatus("saved");
      } else { flashStatus("error"); }
    } catch { flashStatus("error"); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("¿Eliminar esta pregunta? Se borrarán todas las predicciones asociadas.")) return;
    try {
      const res = await fetch("/api/admin/bonus-questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setBonusQuestions((prev) => prev.filter((q) => q.id !== id));
        setBonusResults((prev) => { const next = { ...prev }; delete next[id]; return next; });
        flashStatus("saved");
      } else { flashStatus("error"); }
    } catch { flashStatus("error"); }
  };

  const loadBonusResults = async () => {
    const res = await fetch("/api/admin/bonus-results");
    if (res.ok) {
      const data = await res.json();
      setBonusResults(data.results);
    }
    setBonusLoaded(true);
  };

  useEffect(() => {
    if (tab === "bonus") {
      if (!bonusQuestionsLoaded) loadBonusQuestions();
      if (!bonusLoaded) loadBonusResults();
    }
  }, [tab, bonusQuestionsLoaded, bonusLoaded]);

  const handleSaveBonus = async (questionId: string) => {
    const edit = bonusEdits[questionId];
    if (!edit?.answer?.trim()) return;
    const points = parseInt(edit.points, 10);
    if (isNaN(points) || points < 0) return;

    setBonusSaving(questionId);
    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, correctAnswer: edit.answer.trim(), points }),
      });
      if (res.ok) {
        setBonusResults((prev) => ({ ...prev, [questionId]: { correctAnswer: edit.answer.trim(), points } }));
        setBonusEdits((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
        flashStatus("saved");
      } else {
        flashStatus("error");
      }
    } catch {
      flashStatus("error");
    } finally {
      setBonusSaving(null);
    }
  };

  const getBonusPoints = (questionId: string) =>
    bonusPointsOverride[questionId] ?? bonusResults[questionId]?.points ?? 1;

  const handleUpdateBonusPoints = async (questionId: string, delta: number) => {
    const newPoints = Math.max(0, getBonusPoints(questionId) + delta);
    setBonusPointsOverride((prev) => ({ ...prev, [questionId]: newPoints }));

    const saved = bonusResults[questionId];
    if (saved) {
      setBonusResults((prev) => ({ ...prev, [questionId]: { ...prev[questionId], points: newPoints } }));
    }

    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          correctAnswer: saved?.correctAnswer || "(pendiente)",
          points: newPoints,
        }),
      });
      flashStatus(res.ok ? "saved" : "error");
    } catch {
      flashStatus("error");
    }
  };

  const handleDeleteBonus = async (questionId: string) => {
    if (!confirm("¿Eliminar esta respuesta?")) return;
    setBonusSaving(questionId);
    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (res.ok) {
        setBonusResults((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
        flashStatus("saved");
      } else {
        flashStatus("error");
      }
    } catch {
      flashStatus("error");
    } finally {
      setBonusSaving(null);
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
        {(["users", "matches", "results", "bonus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
              tab === t
                ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10 cursor-pointer",
            )}
          >
            {t === "users" ? "Participantes" : t === "matches" ? "Partidos" : t === "results" ? "Resultados" : "Puntos Extra"}
          </button>
        ))}
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
                <AvatarDisplay avatar={u.avatar} size="md" />

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

                <div className="flex flex-wrap gap-2">
                  <label className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium bg-white/5 text-fifa-dark-gray transition-all hover:text-foreground hover:bg-white/10 cursor-pointer",
                  )}>
                    Cambiar avatar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("Máximo 2MB"); return; }
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("userId", String(u.id));
                        try {
                          const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
                          const data = await res.json();
                          if (res.ok) {
                            setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, avatar: data.url } : usr));
                            flashStatus("saved");
                          } else {
                            alert(data.error || "Error al subir");
                          }
                        } catch {
                          alert("Error de conexión");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {u.avatar.startsWith("http") && (
                    <button
                      onClick={async () => {
                        const emoji = prompt("Elegí un emoji para el avatar:", "⚽");
                        if (!emoji) return;
                        try {
                          const formData = new FormData();
                          // Use a text-based update via admin users endpoint
                          const res = await fetch("/api/admin/update-avatar", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: u.id, avatar: emoji }),
                          });
                          if (res.ok) {
                            setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, avatar: emoji } : usr));
                            flashStatus("saved");
                          }
                        } catch {}
                      }}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium bg-white/5 text-fifa-dark-gray transition-all hover:text-foreground hover:bg-white/10"
                    >
                      Cambiar a emoji
                    </button>
                  )}
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

      {tab === "matches" && (
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

                    return (
                      <div
                        key={km.id}
                        className={cn(
                          "flex items-center gap-2 rounded-xl bg-card-bg px-2.5 py-2 ring-1 transition-all text-xs",
                          setting.exactScore ? "ring-fifa-gold/30 bg-fifa-gold/[0.03]" : "ring-white/5",
                          isSaving && "opacity-50",
                        )}
                      >
                        <span className="flex-1 text-foreground truncate">
                          {km.homeSlot.label} vs {km.awaySlot.label}
                        </span>

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

      {tab === "bonus" && (() => {
        const scopeOrder = ["fecha-1", "fecha-2", "fecha-3", "R32", "R16", "QF", "SF", "FINAL"];
        const scopeLabels: Record<string, string> = {
          "fecha-1": "Fecha 1", "fecha-2": "Fecha 2", "fecha-3": "Fecha 3",
          R32: "16avos", R16: "Octavos", QF: "Cuartos", SF: "Semifinales", FINAL: "Final",
        };
        const typeLabels: Record<string, string> = {
          teams: "Equipos", players: "Jugadores", participants: "Participantes", exact_value: "Valor exacto",
        };
        const scopeGradients: Record<string, string> = {
          "fecha-1": "from-fifa-green to-fifa-teal",
          "fecha-2": "from-fifa-blue to-indigo-600",
          "fecha-3": "from-fifa-purple to-fuchsia-600",
          R32: "from-amber-500 to-fifa-gold",
          R16: "from-fifa-red to-rose-600",
          QF: "from-fifa-teal to-cyan-500",
          SF: "from-fifa-purple to-fifa-blue",
          FINAL: "from-fifa-gold to-amber-600",
        };
        const grouped: Record<string, typeof bonusQuestions> = {};
        for (const q of bonusQuestions) {
          if (!grouped[q.lockScope]) grouped[q.lockScope] = [];
          grouped[q.lockScope].push(q);
        }
        const orderedScopes = scopeOrder.filter((s) => grouped[s]);

        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-fifa-dark-gray">
                {Object.values(bonusResults).filter((r) => r.correctAnswer && r.correctAnswer !== "(pendiente)").length}/{bonusQuestions.length} respuestas cargadas
              </p>
              <button
                onClick={() => setShowAddQuestion(!showAddQuestion)}
                className="rounded-xl bg-gradient-to-r from-fifa-teal to-fifa-blue px-4 py-2 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-fifa-teal/20 transition-all hover:brightness-110"
              >
                + Agregar pregunta
              </button>
            </div>

            {showAddQuestion && (
              <div className="mb-6 rounded-2xl bg-card-bg p-4 ring-1 ring-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newQuestion.id}
                    onChange={(e) => setNewQuestion((prev) => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                    placeholder="ID (ej: mejor-jugador)"
                    className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                  />
                  <input
                    type="text"
                    value={newQuestion.label}
                    onChange={(e) => setNewQuestion((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Título (ej: Mejor jugador)"
                    className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                  />
                  <select
                    value={newQuestion.sourceType}
                    onChange={(e) => setNewQuestion((prev) => ({ ...prev, sourceType: e.target.value }))}
                    className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40"
                  >
                    <option value="teams">Equipos</option>
                    <option value="players">Jugadores</option>
                    <option value="participants">Participantes</option>
                    <option value="exact_value">Valor exacto</option>
                  </select>
                  <select
                    value={newQuestion.lockScope}
                    onChange={(e) => setNewQuestion((prev) => ({ ...prev, lockScope: e.target.value }))}
                    className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40"
                  >
                    {scopeOrder.map((s) => (
                      <option key={s} value={s}>{scopeLabels[s] ?? s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddQuestion(false)} className="rounded-xl px-4 py-2 text-sm text-fifa-dark-gray hover:text-foreground">Cancelar</button>
                  <button onClick={handleAddQuestion} className="rounded-xl bg-fifa-teal px-4 py-2 text-sm font-medium text-white">Agregar</button>
                </div>
              </div>
            )}

            {orderedScopes.map((scope) => (
              <div key={scope} className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${scopeGradients[scope] ?? "from-fifa-teal to-fifa-blue"}`} />
                  <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                    {scopeLabels[scope] ?? scope}
                  </h3>
                  <span className="text-[10px] text-fifa-dark-gray">
                    {grouped[scope].filter((q) => bonusResults[q.id]?.correctAnswer && bonusResults[q.id].correctAnswer !== "(pendiente)").length}/{grouped[scope].length} cargadas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {grouped[scope].map((q) => {
                    const rawSaved = bonusResults[q.id];
                    const saved = rawSaved?.correctAnswer && rawSaved.correctAnswer !== "(pendiente)" ? rawSaved : null;
                    const edit = bonusEdits[q.id];
                    const isEditingAnswer = !!edit;
                    const isEditingQ = editingQuestion === q.id;
                    const isSaving = bonusSaving === q.id;

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "rounded-xl bg-card-bg px-3 py-2.5 ring-1 transition-all",
                          saved ? "ring-fifa-teal/20" : "ring-white/5",
                          isSaving && "opacity-50",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-1">
                          {isEditingQ ? (
                            <div className="flex flex-1 flex-col gap-1.5">
                              <input
                                type="text"
                                value={questionEdit.label}
                                onChange={(e) => setQuestionEdit((prev) => ({ ...prev, label: e.target.value }))}
                                className="rounded-md bg-surface px-2 py-1 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40"
                              />
                              <div className="flex gap-1.5">
                                <select
                                  value={questionEdit.sourceType}
                                  onChange={(e) => setQuestionEdit((prev) => ({ ...prev, sourceType: e.target.value }))}
                                  className="flex-1 rounded-md bg-surface px-2 py-1 text-[10px] text-foreground outline-none ring-1 ring-white/5"
                                >
                                  <option value="teams">Equipos</option>
                                  <option value="players">Jugadores</option>
                                  <option value="participants">Participantes</option>
                                  <option value="exact_value">Valor exacto</option>
                                </select>
                                <select
                                  value={questionEdit.lockScope}
                                  onChange={(e) => setQuestionEdit((prev) => ({ ...prev, lockScope: e.target.value }))}
                                  className="flex-1 rounded-md bg-surface px-2 py-1 text-[10px] text-foreground outline-none ring-1 ring-white/5"
                                >
                                  {scopeOrder.map((s) => (
                                    <option key={s} value={s}>{scopeLabels[s] ?? s}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleSaveQuestion(q.id)} className="rounded-md bg-fifa-green/20 px-2 py-0.5 text-[10px] text-fifa-green hover:bg-fifa-green/30">✓</button>
                                <button onClick={() => setEditingQuestion(null)} className="rounded-md px-2 py-0.5 text-[10px] text-fifa-dark-gray hover:text-foreground">✗</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                              <span className="text-xs font-medium text-foreground truncate">{q.label}</span>
                              <span className="text-[9px] text-fifa-dark-gray/40 flex-shrink-0">{typeLabels[q.sourceType] ?? q.sourceType}</span>
                              <button
                                onClick={() => { setEditingQuestion(q.id); setQuestionEdit({ label: q.label, sourceType: q.sourceType, lockScope: q.lockScope }); }}
                                className="flex-shrink-0 rounded-md p-1 text-fifa-dark-gray/40 hover:text-fifa-teal hover:bg-white/5 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="flex-shrink-0 rounded-md p-1 text-fifa-dark-gray/40 hover:text-fifa-red hover:bg-fifa-red/5 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {!isEditingQ && (
                            <div className="flex items-center gap-0.5 rounded-md bg-surface ring-1 ring-white/5">
                              <button type="button" onClick={() => handleUpdateBonusPoints(q.id, -1)} className="px-1.5 py-0.5 text-xs text-fifa-dark-gray hover:text-foreground">−</button>
                              <span className="w-auto px-0.5 text-center text-xs font-bold text-fifa-gold">{getBonusPoints(q.id) === 1 ? "1pt" : `${getBonusPoints(q.id)}pts`}</span>
                              <button type="button" onClick={() => handleUpdateBonusPoints(q.id, 1)} className="px-1.5 py-0.5 text-xs text-fifa-dark-gray hover:text-foreground">+</button>
                            </div>
                          )}
                        </div>

                        {!isEditingQ && (isEditingAnswer ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={edit.answer}
                              onChange={(e) => setBonusEdits((prev) => ({ ...prev, [q.id]: { ...prev[q.id], answer: e.target.value } }))}
                              placeholder="Respuesta correcta"
                              className="flex-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                            />
                            <button onClick={() => handleSaveBonus(q.id)} disabled={isSaving} className="rounded-lg bg-fifa-green/20 px-2 py-1 text-xs text-fifa-green hover:bg-fifa-green/30">✓</button>
                            <button onClick={() => setBonusEdits((prev) => { const next = { ...prev }; delete next[q.id]; return next; })} className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:text-foreground">✗</button>
                          </div>
                        ) : saved ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex-1 truncate rounded-lg bg-fifa-teal/10 px-2 py-1 text-xs font-medium text-fifa-teal">{saved.correctAnswer}</span>
                            <button onClick={() => setBonusEdits((prev) => ({ ...prev, [q.id]: { answer: saved.correctAnswer, points: String(saved.points) } }))} className="rounded-lg px-1.5 py-1 text-[10px] text-fifa-dark-gray hover:bg-white/5 hover:text-foreground">Editar</button>
                            <button onClick={() => handleDeleteBonus(q.id)} className="rounded-lg px-1.5 py-1 text-[10px] text-fifa-red/50 hover:text-fifa-red">Borrar</button>
                          </div>
                        ) : (
                          <button onClick={() => setBonusEdits((prev) => ({ ...prev, [q.id]: { answer: "", points: "1" } }))} className="w-full rounded-lg bg-white/5 py-1.5 text-xs text-fifa-dark-gray hover:text-foreground hover:bg-white/10">+ Cargar respuesta</button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

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
