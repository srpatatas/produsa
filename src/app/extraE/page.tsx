"use client";

import { useState, useEffect } from "react";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";

interface AnswerGroup {
  answer: string;
  users: Array<{ userId: number; userName: string; avatar: string }>;
  count: number;
}

interface BonusQuestion {
  id: string;
  label: string;
  subtitle: string | null;
  points: number;
  correctAnswer: string | null;
  totalPredictions: number;
  grouped: AnswerGroup[];
}

const SECTIONS = [
  { title: "Podio", icon: "🏆", ids: ["campeon", "subcampeon", "tercer-puesto"] },
  { title: "Equipos", icon: "🌍", ids: ["ultimo-mundial", "valla-menos", "valla-mas", "revelacion", "abuela-choli", "fair-play", "anti-fair-play"] },
  { title: "Goleadores", icon: "⚽", ids: ["goleador", "balon-oro", "primer-gol-arg", "ultimo-gol-arg"] },
  { title: "Produsa", icon: "🎯", ids: ["primer-prode", "ultimo-prode"] },
];

function AnswerRow({ g, totalUsers, isCorrect }: { g: AnswerGroup; totalUsers: number; isCorrect: boolean | null }) {
  const [expanded, setExpanded] = useState(false);
  const pct = totalUsers > 0 ? Math.round((g.count / totalUsers) * 100) : 0;

  return (
    <div className={cn(
      "rounded-xl ring-1 overflow-hidden",
      isCorrect === true ? "ring-fifa-green/30 bg-fifa-green/5" : "ring-white/5 bg-white/[0.02]",
    )}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 text-left"
      >
        <div className="mb-1.5 flex items-center justify-between">
          <span className={cn(
            "text-xs font-medium",
            isCorrect === true ? "text-fifa-green" : "text-foreground",
          )}>
            {g.answer} {isCorrect === true && "✓"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-fifa-dark-gray">{g.count} ({pct}%)</span>
            <svg
              className={cn("h-3.5 w-3.5 text-fifa-dark-gray/50 transition-transform duration-200", expanded && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              isCorrect === true ? "bg-fifa-green" : "bg-fifa-blue",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3" style={{ animation: "slideDown 0.2s ease-out" }}>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {g.users.map((u) => (
              <div key={u.userId} className={cn("flex flex-col items-center gap-1", isCorrect === false && "opacity-30")}>
                <div className="rounded-full ring-2 ring-fifa-blue">
                  <AvatarDisplay avatar={u.avatar} size="sm" />
                </div>
                <span className="text-[9px] text-fifa-dark-gray truncate max-w-full text-center">
                  {u.userName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCarousel({ questions, totalUsers }: { questions: BonusQuestion[]; totalUsers: number }) {
  const [current, setCurrent] = useState(0);

  if (questions.length === 0) return null;
  const q = questions[current];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-full bg-white/5 p-1.5 text-foreground disabled:opacity-20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h4 className="text-sm font-semibold text-foreground">{q.label}</h4>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-fifa-gold">+{q.points} pts</span>
            {questions.length > 1 && (
              <span className="text-[10px] text-fifa-dark-gray">{current + 1}/{questions.length}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          disabled={current === questions.length - 1}
          className="rounded-full bg-white/5 p-1.5 text-foreground disabled:opacity-20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="space-y-2.5">
        {q.grouped.map((g) => (
          <AnswerRow key={g.answer} g={g} totalUsers={totalUsers} isCorrect={q.correctAnswer ? g.answer === q.correctAnswer : null} />
        ))}
      </div>

      {questions.length > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === current ? "w-4 bg-fifa-blue" : "w-1.5 bg-fifa-dark-gray/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExtraEPage() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/extras")
      .then((r) => r.ok ? r.json() : { questions: [], totalUsers: 0 })
      .then((d) => { setQuestions(d.questions); setTotalUsers(d.totalUsers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12 text-fifa-dark-gray">Cargando...</div>;

  const qMap = new Map(questions.map((q) => [q.id, q]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Puntos Extra</h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">
          Predicciones de todos los participantes. Se resuelven al final del torneo.
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        {SECTIONS.map((section) => {
          const sectionQuestions = section.ids.map((id) => qMap.get(id)).filter(Boolean) as BonusQuestion[];
          if (sectionQuestions.length === 0) return null;
          return (
            <div key={section.title} className="rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <QuestionCarousel questions={sectionQuestions} totalUsers={totalUsers} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
