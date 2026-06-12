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
  { title: "Goleadores y Premios", icon: "⚽", ids: ["goleador", "balon-oro"] },
  { title: "Argentina", icon: "🇦🇷", ids: ["primer-gol-arg", "ultimo-gol-arg"] },
  { title: "Equipos", icon: "🌍", ids: ["ultimo-mundial", "valla-menos", "valla-mas", "revelacion"] },
  { title: "Fair Play", icon: "🤝", ids: ["fair-play", "anti-fair-play"] },
  { title: "Especiales", icon: "🎲", ids: ["abuela-choli"] },
  { title: "Produsa", icon: "🎯", ids: ["primer-prode", "ultimo-prode"] },
];

function QuestionCard({ q, totalUsers }: { q: BonusQuestion; totalUsers: number }) {
  const [expanded, setExpanded] = useState(false);
  const topGroups = expanded ? q.grouped : q.grouped.slice(0, 3);
  const hasMore = q.grouped.length > 3;

  return (
    <div className="rounded-2xl bg-card-bg p-4 ring-1 ring-white/5">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-foreground">{q.label}</h4>
        <span className="text-[10px] font-medium text-fifa-gold">+{q.points} pts</span>
      </div>

      <div className="space-y-2">
        {topGroups.map((g) => {
          const pct = totalUsers > 0 ? Math.round((g.count / totalUsers) * 100) : 0;
          const isCorrect = q.correctAnswer && g.answer === q.correctAnswer;
          return (
            <div key={g.answer}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-medium",
                    isCorrect ? "text-fifa-green" : "text-foreground",
                  )}>
                    {g.answer} {isCorrect && "✓"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {g.users.slice(0, 5).map((u) => (
                      <div key={u.userId} title={u.userName} className="ring-1 ring-card-bg rounded-full">
                        <AvatarDisplay avatar={u.avatar} size="xs" />
                      </div>
                    ))}
                    {g.users.length > 5 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[8px] font-bold text-fifa-dark-gray ring-1 ring-card-bg">
                        +{g.users.length - 5}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-fifa-dark-gray w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/5">
                <div
                  className={cn("h-1 rounded-full", isCorrect ? "bg-fifa-green" : "bg-fifa-blue")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[10px] font-medium text-fifa-blue hover:text-fifa-blue/80"
        >
          {expanded ? "Ver menos" : `Ver todas (${q.grouped.length})`}
        </button>
      )}
    </div>
  );
}

export default function ExtraDPage() {
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
        <p className="mt-1 text-xs text-fifa-dark-gray">Opción D: Secciones temáticas con tarjetas</p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const sectionQuestions = section.ids.map((id) => qMap.get(id)).filter(Boolean) as BonusQuestion[];
          if (sectionQuestions.length === 0) return null;
          return (
            <div key={section.title}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-fifa-dark-gray">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <div className="space-y-3">
                {sectionQuestions.map((q) => (
                  <QuestionCard key={q.id} q={q} totalUsers={totalUsers} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
