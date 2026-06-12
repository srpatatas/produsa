"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function ExtraCPage() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/extras")
      .then((r) => r.ok ? r.json() : { questions: [], totalUsers: 0 })
      .then((d) => { setQuestions(d.questions); setTotalUsers(d.totalUsers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(questions.length - 1, c + 1)), [questions.length]);

  if (loading) return <div className="flex justify-center py-12 text-fifa-dark-gray">Cargando...</div>;
  if (questions.length === 0) return null;

  const q = questions[current];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Puntos Extra</h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">Opción C: Question Carousel — deslizá entre preguntas</p>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={current === 0}
            className="rounded-full bg-white/5 p-2 text-foreground disabled:opacity-20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">{q.label}</h3>
            <span className="text-[10px] text-fifa-gold">+{q.points} pts</span>
            <span className="ml-2 text-[10px] text-fifa-dark-gray">{current + 1}/{questions.length}</span>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={current === questions.length - 1}
            className="rounded-full bg-white/5 p-2 text-foreground disabled:opacity-20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {q.grouped.map((g) => {
            const pct = totalUsers > 0 ? Math.round((g.count / totalUsers) * 100) : 0;
            const isCorrect = q.correctAnswer && g.answer === q.correctAnswer;
            return (
              <div key={g.answer} className={cn(
                "rounded-2xl p-4 ring-1",
                isCorrect ? "ring-fifa-green/30 bg-fifa-green/5" : "ring-white/5 bg-card-bg",
              )}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-semibold",
                    isCorrect ? "text-fifa-green" : "text-foreground",
                  )}>
                    {g.answer} {isCorrect && "✓"}
                  </span>
                  <span className="text-xs text-fifa-dark-gray">{g.count} votos ({pct}%)</span>
                </div>
                <div className="mb-3 h-2 rounded-full bg-white/5">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      isCorrect ? "bg-fifa-green" : "bg-fifa-blue",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.users.map((u) => (
                    <div key={u.userId} className="flex items-center gap-1">
                      <AvatarDisplay avatar={u.avatar} size="xs" />
                      <span className="text-[10px] text-fifa-dark-gray">{u.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-1">
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
      </div>
    </div>
  );
}
