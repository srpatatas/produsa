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
  points: number;
  correctAnswer: string | null;
  totalPredictions: number;
  grouped: AnswerGroup[];
}

interface UserRow {
  userId: number;
  userName: string;
  avatar: string;
  answers: Record<string, string>;
}

export default function ExtraBPage() {
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

  const userRows: UserRow[] = [];
  const userMap = new Map<number, UserRow>();
  for (const q of questions) {
    for (const g of q.grouped) {
      for (const u of g.users) {
        if (!userMap.has(u.userId)) {
          const row = { userId: u.userId, userName: u.userName, avatar: u.avatar, answers: {} as Record<string, string> };
          userMap.set(u.userId, row);
          userRows.push(row);
        }
        userMap.get(u.userId)!.answers[q.id] = g.answer;
      }
    }
  }
  userRows.sort((a, b) => a.userName.localeCompare(b.userName));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Puntos Extra</h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">Opción B: Matrix Table — jugadores × preguntas</p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card-bg ring-1 ring-white/5">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="sticky left-0 z-10 bg-card-bg px-3 py-2 text-left text-[10px] font-semibold text-fifa-dark-gray">Jugador</th>
              {questions.map((q) => (
                <th key={q.id} className="px-2 py-2 text-center font-semibold text-fifa-dark-gray whitespace-nowrap">
                  <div>{q.label}</div>
                  <div className="text-[8px] text-fifa-gold font-normal">+{q.points}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {userRows.map((u) => (
              <tr key={u.userId} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="sticky left-0 z-10 bg-card-bg px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <AvatarDisplay avatar={u.avatar} size="xs" />
                    <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{u.userName}</span>
                  </div>
                </td>
                {questions.map((q) => {
                  const answer = u.answers[q.id];
                  const isCorrect = q.correctAnswer && answer === q.correctAnswer;
                  return (
                    <td key={q.id} className={cn(
                      "px-2 py-1.5 text-center whitespace-nowrap",
                      isCorrect ? "text-fifa-green" : "text-foreground/70",
                    )}>
                      {answer ?? <span className="text-fifa-dark-gray/30">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
