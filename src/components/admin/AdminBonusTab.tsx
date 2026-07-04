"use client";

import { useState, useEffect, useRef } from "react";
import { teams } from "@/data/teams";
import { cn } from "@/lib/utils";

const teamOptions = Object.values(teams)
  .map((t) => ({ value: t.id, label: t.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface AdminBonusTabProps {
  flashStatus: (status: "saved" | "error") => void;
}

const scopeOrder = ["fecha-1", "fecha-2", "fecha-3", "R32", "R16", "QF", "SF", "FINAL"];
const scopeLabels: Record<string, string> = {
  "fecha-1": "Fecha 1", "fecha-2": "Fecha 2", "fecha-3": "Fecha 3",
  R32: "16avos", R16: "Octavos", QF: "Cuartos", SF: "Semifinales", FINAL: "Final",
};
const typeLabels: Record<string, string> = {
  teams: "Equipos", players: "Jugadores", participants: "Participantes", exact_value: "Valor aproximado",
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

export function AdminBonusTab({ flashStatus }: AdminBonusTabProps) {
  const [bonusResults, setBonusResults] = useState<Record<string, { correctAnswer: string; scored: boolean }>>({});
  const [bonusLoaded, setBonusLoaded] = useState(false);
  const [bonusEdits, setBonusEdits] = useState<Record<string, { answer: string }>>({});
  const [bonusPointsOverride, setBonusPointsOverride] = useState<Record<string, number>>({});
  const [bonusSaving, setBonusSaving] = useState<string | null>(null);

  const [bonusQuestions, setBonusQuestions] = useState<{ id: string; label: string; subtitle?: string; points?: number; sourceType: string; lockScope: string; excludedTeams?: string; teamFilter?: string }[]>([]);
  const [bonusQuestionsLoaded, setBonusQuestionsLoaded] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [questionEdit, setQuestionEdit] = useState<{ label: string; subtitle: string; sourceType: string; lockScope: string; excludedTeams: string; teamFilter: string }>({ label: "", subtitle: "", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "", teamFilter: "" });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{ id: string; label: string; subtitle: string; points: string; sourceType: string; lockScope: string; excludedTeams: string; teamFilter: string }>({ id: "", label: "", subtitle: "", points: "1", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "", teamFilter: "" });

  const [participantOptions, setParticipantOptions] = useState<{ value: string; label: string }[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{ value: string; label: string }[]>([]);
  const [answerDropdownId, setAnswerDropdownId] = useState<string | null>(null);
  const [answerSearch, setAnswerSearch] = useState("");

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
        setNewQuestion({ id: "", label: "", subtitle: "", points: "1", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "", teamFilter: "" });
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
    if (!bonusQuestionsLoaded) loadBonusQuestions();
    if (!bonusLoaded) loadBonusResults();
    fetch("/api/participants").then((r) => r.ok ? r.json() : { participants: [] })
      .then((d) => setParticipantOptions(d.participants.map((p: { name: string }) => ({ value: p.name, label: p.name }))))
      .catch(() => {});
    fetch("/api/players").then((r) => r.ok ? r.json() : { players: [] })
      .then((d) => setPlayerOptions(d.players.map((p: { name: string; teamId: string }) => ({ value: `${p.name} (${p.teamId})`, label: `${p.name} (${p.teamId})` }))))
      .catch(() => {});
  }, [bonusQuestionsLoaded, bonusLoaded]);

  const handleSaveBonus = async (questionId: string) => {
    const edit = bonusEdits[questionId];
    if (!edit?.answer?.trim()) return;

    setBonusSaving(questionId);
    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, correctAnswer: edit.answer.trim() }),
      });
      if (res.ok) {
        setBonusResults((prev) => ({ ...prev, [questionId]: { correctAnswer: edit.answer.trim(), scored: prev[questionId]?.scored ?? false } }));
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

  const getBonusPoints = (questionId: string) => {
    if (bonusPointsOverride[questionId] != null) return bonusPointsOverride[questionId];
    const q = bonusQuestions.find((bq) => bq.id === questionId);
    return q?.points ?? 1;
  };

  const handleUpdateBonusPoints = async (questionId: string, delta: number) => {
    const newPoints = Math.max(0, getBonusPoints(questionId) + delta);
    setBonusPointsOverride((prev) => ({ ...prev, [questionId]: newPoints }));
    setBonusQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, points: newPoints } : q));

    const q = bonusQuestions.find((bq) => bq.id === questionId);
    if (!q) return;

    try {
      const res = await fetch("/api/admin/bonus-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: questionId,
          label: q.label,
          subtitle: q.subtitle || "",
          points: newPoints,
          sourceType: q.sourceType,
          lockScope: q.lockScope,
          excludedTeams: q.excludedTeams || "",
          teamFilter: q.teamFilter || "",
        }),
      });
      flashStatus(res.ok ? "saved" : "error");
    } catch {
      flashStatus("error");
    }
  };

  const handleToggleScored = async (questionId: string) => {
    const current = bonusResults[questionId]?.scored ?? false;
    setBonusResults((prev) => ({ ...prev, [questionId]: { ...prev[questionId], scored: !current } }));
    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, scored: !current }),
      });
      flashStatus(res.ok ? "saved" : "error");
      if (!res.ok) setBonusResults((prev) => ({ ...prev, [questionId]: { ...prev[questionId], scored: current } }));
    } catch {
      setBonusResults((prev) => ({ ...prev, [questionId]: { ...prev[questionId], scored: current } }));
      flashStatus("error");
    }
  };

  const handleScoreAll = async (scored: boolean) => {
    const prev = { ...bonusResults };
    setBonusResults((old) => {
      const next = { ...old };
      for (const k of Object.keys(next)) next[k] = { ...next[k], scored };
      return next;
    });
    try {
      const res = await fetch("/api/admin/bonus-results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreAll: scored }),
      });
      flashStatus(res.ok ? "saved" : "error");
      if (!res.ok) setBonusResults(prev);
    } catch {
      setBonusResults(prev);
      flashStatus("error");
    }
  };

  const handleDeleteBonus = async (questionId: string) => {
    if (!confirm("¿Borrar la respuesta correcta? La pregunta seguirá existiendo, solo se limpia el resultado.")) return;
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

  const getOptionsForQuestion = (q: typeof bonusQuestions[0]) => {
    if (q.sourceType === "teams") {
      const excluded = q.excludedTeams ? new Set(q.excludedTeams.split(",").map((s) => s.trim())) : null;
      return excluded ? teamOptions.filter((o) => !excluded.has(o.value)) : teamOptions;
    }
    if (q.sourceType === "participants") return participantOptions;
    if (q.sourceType === "players") {
      return q.teamFilter ? playerOptions.filter((o) => o.value.endsWith(`(${q.teamFilter})`)) : playerOptions;
    }
    return [];
  };

  const grouped: Record<string, typeof bonusQuestions> = {};
  for (const q of bonusQuestions) {
    if (!grouped[q.lockScope]) grouped[q.lockScope] = [];
    grouped[q.lockScope].push(q);
  }
  const orderedScopes = scopeOrder.filter((s) => grouped[s]);

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-fifa-dark-gray">
            {Object.values(bonusResults).filter((r) => r.correctAnswer && r.correctAnswer !== "(pendiente)").length}/{bonusQuestions.length} respuestas cargadas
            {" · "}
            <span className={Object.values(bonusResults).some((r) => r.scored) ? "text-fifa-green" : "text-fifa-dark-gray"}>
              {Object.values(bonusResults).filter((r) => r.scored).length} puntuadas
            </span>
          </p>
          <button
            onClick={() => setShowAddQuestion(!showAddQuestion)}
            className="rounded-xl bg-gradient-to-r from-fifa-teal to-fifa-blue px-4 py-2 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-fifa-teal/20 transition-all hover:brightness-110"
          >
            + Agregar pregunta
          </button>
        </div>
        {Object.values(bonusResults).some((r) => r.correctAnswer && r.correctAnswer !== "(pendiente)") && (
          <div className="flex items-center gap-2">
            {Object.values(bonusResults).some((r) => !r.scored && r.correctAnswer && r.correctAnswer !== "(pendiente)") && (
              <button
                onClick={() => { if (confirm("¿Puntuar TODAS las preguntas con respuesta? Los puntos se sumarán al ranking.")) handleScoreAll(true); }}
                className="rounded-xl bg-gradient-to-r from-fifa-green to-emerald-600 px-4 py-2 font-display text-xs uppercase tracking-wider text-white shadow-lg shadow-fifa-green/20 transition-all hover:brightness-110"
              >
                Puntuar todas
              </button>
            )}
            {Object.values(bonusResults).some((r) => r.scored) && (
              <button
                onClick={() => { if (confirm("¿Quitar puntuación de TODAS las preguntas? Se quitarán los puntos del ranking.")) handleScoreAll(false); }}
                className="rounded-xl bg-gradient-to-r from-fifa-red to-rose-600 px-4 py-2 font-display text-xs uppercase tracking-wider text-white shadow-lg shadow-fifa-red/20 transition-all hover:brightness-110"
              >
                Despuntuar todas
              </button>
            )}
          </div>
        )}
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
          </div>
          <input
            type="text"
            value={newQuestion.subtitle}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Subtítulo / descripción (opcional)"
            className="w-full rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
          />
          <div className="grid grid-cols-3 gap-3">
            <select
              value={newQuestion.sourceType}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, sourceType: e.target.value }))}
              className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40"
            >
              <option value="teams">Equipos</option>
              <option value="players">Jugadores</option>
              <option value="participants">Participantes</option>
              <option value="exact_value">Valor aproximado</option>
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
            <div className="flex items-center gap-0.5 rounded-lg bg-surface ring-1 ring-white/5 self-center justify-center">
              <button type="button" onClick={() => setNewQuestion((prev) => ({ ...prev, points: String(Math.max(0, parseInt(prev.points) - 1)) }))} className="px-2 py-1.5 text-xs text-fifa-dark-gray hover:text-foreground">−</button>
              <span className="px-1 text-xs font-bold text-fifa-gold">{newQuestion.points}pts</span>
              <button type="button" onClick={() => setNewQuestion((prev) => ({ ...prev, points: String(parseInt(prev.points) + 1) }))} className="px-2 py-1.5 text-xs text-fifa-dark-gray hover:text-foreground">+</button>
            </div>
          </div>
          {newQuestion.sourceType === "teams" && (
            <input
              type="text"
              value={newQuestion.excludedTeams}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, excludedTeams: e.target.value.toUpperCase() }))}
              placeholder="Equipos excluidos (ej: ARG,BRA,FRA) (opcional)"
              className="w-full rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
            />
          )}
          {newQuestion.sourceType === "players" && (
            <input
              type="text"
              value={newQuestion.teamFilter}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, teamFilter: e.target.value.toUpperCase() }))}
              placeholder="Filtrar por equipo (ej: ARG) (opcional)"
              className="w-full rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
            />
          )}
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
                          placeholder="Título"
                          className="rounded-md bg-surface px-2 py-1 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40"
                        />
                        <input
                          type="text"
                          value={questionEdit.subtitle}
                          onChange={(e) => setQuestionEdit((prev) => ({ ...prev, subtitle: e.target.value }))}
                          placeholder="Subtítulo (descripción)"
                          className="rounded-md bg-surface px-2 py-1 text-[10px] text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
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
                            <option value="exact_value">Valor aproximado</option>
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
                        {questionEdit.sourceType === "teams" && (
                          <input
                            type="text"
                            value={questionEdit.excludedTeams}
                            onChange={(e) => setQuestionEdit((prev) => ({ ...prev, excludedTeams: e.target.value.toUpperCase() }))}
                            placeholder="Equipos excluidos (ej: ARG,BRA,FRA)"
                            className="rounded-md bg-surface px-2 py-1 text-[10px] text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                          />
                        )}
                        {questionEdit.sourceType === "players" && (
                          <input
                            type="text"
                            value={questionEdit.teamFilter}
                            onChange={(e) => setQuestionEdit((prev) => ({ ...prev, teamFilter: e.target.value.toUpperCase() }))}
                            placeholder="Filtrar por equipo (ej: ARG)"
                            className="rounded-md bg-surface px-2 py-1 text-[10px] text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                          />
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => handleSaveQuestion(q.id)} className="rounded-md bg-fifa-green/20 px-2 py-0.5 text-[10px] text-fifa-green hover:bg-fifa-green/30">✓</button>
                          <button onClick={() => setEditingQuestion(null)} className="rounded-md px-2 py-0.5 text-[10px] text-fifa-dark-gray hover:text-foreground">✗</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground truncate">{q.label}</span>
                          <span className="text-[9px] text-fifa-dark-gray/40 flex-shrink-0">{typeLabels[q.sourceType] ?? q.sourceType}</span>
                          <button
                            onClick={() => { setEditingQuestion(q.id); setQuestionEdit({ label: q.label, subtitle: q.subtitle || "", sourceType: q.sourceType, lockScope: q.lockScope, excludedTeams: q.excludedTeams || "", teamFilter: q.teamFilter || "" }); }}
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
                        {q.subtitle && (
                          <p className="text-[9px] text-fifa-dark-gray/50 truncate mt-0.5">{q.subtitle}</p>
                        )}
                        {q.excludedTeams && (
                          <p className="text-[9px] text-fifa-red/50 truncate mt-0.5">Excluidos: {q.excludedTeams}</p>
                        )}
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
                    <div className="relative">
                      {q.sourceType === "exact_value" ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={edit.answer}
                            onChange={(e) => setBonusEdits((prev) => ({ ...prev, [q.id]: { ...prev[q.id], answer: e.target.value.replace(/[^0-9]/g, "") } }))}
                            placeholder="Valor correcto"
                            className="flex-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
                          />
                          <button onClick={() => handleSaveBonus(q.id)} disabled={isSaving} className="rounded-lg bg-fifa-green/20 px-2 py-1 text-xs text-fifa-green hover:bg-fifa-green/30">✓</button>
                          <button onClick={() => { setBonusEdits((prev) => { const next = { ...prev }; delete next[q.id]; return next; }); setAnswerDropdownId(null); }} className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:text-foreground">✗</button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setAnswerDropdownId(answerDropdownId === q.id ? null : q.id); setAnswerSearch(""); }}
                              className={cn(
                                "flex flex-1 items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 text-xs text-left ring-1 transition-all",
                                answerDropdownId === q.id ? "ring-fifa-teal/40" : "ring-white/5 hover:ring-white/15",
                                edit.answer ? "text-foreground" : "text-fifa-dark-gray/40",
                              )}
                            >
                              <span className="truncate">{edit.answer || "Elegir..."}</span>
                              <span className="text-base text-fifa-dark-gray/70">▾</span>
                            </button>
                            <button onClick={() => handleSaveBonus(q.id)} disabled={isSaving || !edit.answer} className="rounded-lg bg-fifa-green/20 px-2 py-1 text-xs text-fifa-green hover:bg-fifa-green/30 disabled:opacity-30">✓</button>
                            <button onClick={() => { setBonusEdits((prev) => { const next = { ...prev }; delete next[q.id]; return next; }); setAnswerDropdownId(null); }} className="rounded-lg px-2 py-1 text-xs text-fifa-dark-gray hover:text-foreground">✗</button>
                          </div>
                          {answerDropdownId === q.id && (
                            <div className="absolute z-[60] mt-1 w-full rounded-xl bg-card-bg shadow-xl shadow-black/30 ring-1 ring-white/10">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={answerSearch}
                                  onChange={(e) => setAnswerSearch(e.target.value)}
                                  placeholder="Buscar..."
                                  autoFocus
                                  className="w-full rounded-lg bg-surface px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-fifa-dark-gray/30"
                                />
                              </div>
                              <div className="max-h-40 overflow-y-auto px-1 pb-1">
                                {getOptionsForQuestion(q).filter((o) => o.label.toLowerCase().includes(answerSearch.toLowerCase())).map((o) => (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => {
                                      setBonusEdits((prev) => ({ ...prev, [q.id]: { answer: o.value } }));
                                      setAnswerDropdownId(null);
                                      setAnswerSearch("");
                                    }}
                                    className={cn(
                                      "w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors",
                                      o.value === edit.answer ? "bg-fifa-teal/20 text-fifa-teal" : "text-foreground hover:bg-white/5",
                                    )}
                                  >
                                    {o.label}
                                  </button>
                                ))}
                                {getOptionsForQuestion(q).filter((o) => o.label.toLowerCase().includes(answerSearch.toLowerCase())).length === 0 && (
                                  <p className="px-3 py-2 text-xs text-fifa-dark-gray/40">Sin resultados</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : saved ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("flex-1 truncate rounded-lg px-2 py-1 text-xs font-medium", saved.scored ? "bg-fifa-green/15 text-fifa-green" : "bg-fifa-teal/10 text-fifa-teal")}>{saved.correctAnswer}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleScored(q.id)}
                          className={cn("rounded-lg px-1.5 py-1 text-[10px] transition-colors", saved.scored ? "text-fifa-green bg-fifa-green/10 hover:bg-fifa-green/20" : "text-fifa-dark-gray hover:bg-white/5 hover:text-foreground")}
                          title={saved.scored ? "Puntuada — click para despuntuar" : "Sin puntuar — click para puntuar"}
                        >
                          {saved.scored ? "✓ Puntuada" : "Puntuar"}
                        </button>
                        <button onClick={() => setBonusEdits((prev) => ({ ...prev, [q.id]: { answer: saved.correctAnswer } }))} className="rounded-lg px-1.5 py-1 text-[10px] text-fifa-dark-gray hover:bg-white/5 hover:text-foreground">Editar</button>
                        <button onClick={() => handleDeleteBonus(q.id)} className="rounded-lg px-1.5 py-1 text-[10px] text-fifa-red/50 hover:text-fifa-red">Borrar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setBonusEdits((prev) => ({ ...prev, [q.id]: { answer: "" } })); if (q.sourceType !== "exact_value") setAnswerDropdownId(q.id); }} className="w-full rounded-lg bg-white/5 py-1.5 text-xs text-fifa-dark-gray hover:text-foreground hover:bg-white/10">+ Cargar respuesta</button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
