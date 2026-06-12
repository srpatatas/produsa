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
  sourceType: string;
  correctAnswer: string | null;
  totalPredictions: number;
  grouped: AnswerGroup[];
}

export default function ExtraAPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Puntos Extra</h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">Opción A: Card Grid — una tarjeta por pregunta</p>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">{q.label}</h3>
              <span className="text-[10px] font-medium text-fifa-gold">+{q.points} pts</span>
            </div>

            <div className="space-y-2">
              {q.grouped.map((g) => {
                const pct = totalUsers > 0 ? Math.round((g.count / totalUsers) * 100) : 0;
                const isCorrect = q.correctAnswer && g.answer === q.correctAnswer;
                return (
                  <div key={g.answer} className={cn(
                    "rounded-xl p-2.5 ring-1",
                    isCorrect ? "ring-fifa-green/30 bg-fifa-green/5" : "ring-white/5 bg-white/[0.02]",
                  )}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-medium",
                        isCorrect ? "text-fifa-green" : "text-foreground",
                      )}>
                        {g.answer} {isCorrect && "✓"}
                      </span>
                      <span className="text-[10px] text-fifa-dark-gray">{g.count} ({pct}%)</span>
                    </div>
                    <div className="mb-2 h-1 rounded-full bg-white/5">
                      <div
                        className={cn("h-1 rounded-full", isCorrect ? "bg-fifa-green" : "bg-fifa-blue")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {g.users.map((u) => (
                        <div key={u.userId} title={u.userName}>
                          <AvatarDisplay avatar={u.avatar} size="xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
