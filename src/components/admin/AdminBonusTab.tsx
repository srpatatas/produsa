"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdminBonusTabProps {
  flashStatus: (status: "saved" | "error") => void;
}

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

export function AdminBonusTab({ flashStatus }: AdminBonusTabProps) {
  const [bonusResults, setBonusResults] = useState<Record<string, { correctAnswer: string; points: number }>>({});
  const [bonusLoaded, setBonusLoaded] = useState(false);
  const [bonusEdits, setBonusEdits] = useState<Record<string, { answer: string; points: string }>>({});
  const [bonusPointsOverride, setBonusPointsOverride] = useState<Record<string, number>>({});
  const [bonusSaving, setBonusSaving] = useState<string | null>(null);

  const [bonusQuestions, setBonusQuestions] = useState<{ id: string; label: string; subtitle?: string; points?: number; sourceType: string; lockScope: string; excludedTeams?: string }[]>([]);
  const [bonusQuestionsLoaded, setBonusQuestionsLoaded] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [questionEdit, setQuestionEdit] = useState<{ label: string; subtitle: string; sourceType: string; lockScope: string; excludedTeams: string }>({ label: "", subtitle: "", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "" });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{ id: string; label: string; subtitle: string; sourceType: string; lockScope: string; excludedTeams: string }>({ id: "", label: "", subtitle: "", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "" });

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
        setNewQuestion({ id: "", label: "", subtitle: "", sourceType: "teams", lockScope: "fecha-1", excludedTeams: "" });
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
  }, [bonusQuestionsLoaded, bonusLoaded]);

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

  const getBonusPoints = (questionId: string) => {
    if (bonusPointsOverride[questionId] != null) return bonusPointsOverride[questionId];
    if (bonusResults[questionId]?.points != null) return bonusResults[questionId].points;
    const q = bonusQuestions.find((bq) => bq.id === questionId);
    return q?.points ?? 1;
  };

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
          </div>
          <input
            type="text"
            value={newQuestion.subtitle}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Subtítulo / descripción (opcional)"
            className="w-full rounded-lg bg-surface px-3 py-2 text-xs text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-teal/40 placeholder:text-fifa-dark-gray/30"
          />
          <div className="grid grid-cols-2 gap-3">
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
          {newQuestion.sourceType === "teams" && (
            <input
              type="text"
              value={newQuestion.excludedTeams}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, excludedTeams: e.target.value.toUpperCase() }))}
              placeholder="Equipos excluidos (ej: ARG,BRA,FRA) (opcional)"
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
                        {questionEdit.sourceType === "teams" && (
                          <input
                            type="text"
                            value={questionEdit.excludedTeams}
                            onChange={(e) => setQuestionEdit((prev) => ({ ...prev, excludedTeams: e.target.value.toUpperCase() }))}
                            placeholder="Equipos excluidos (ej: ARG,BRA,FRA)"
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
                            onClick={() => { setEditingQuestion(q.id); setQuestionEdit({ label: q.label, subtitle: q.subtitle || "", sourceType: q.sourceType, lockScope: q.lockScope, excludedTeams: q.excludedTeams || "" }); }}
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
}
