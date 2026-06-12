"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  { title: "Podio", icon: "🏆", ids: ["campeon", "subcampeon", "tercer-puesto"], gradient: "from-yellow-500/90 via-fifa-gold to-amber-500" },
  { title: "Equipos", icon: "🌍", ids: ["ultimo-mundial", "valla-menos", "valla-mas", "revelacion", "abuela-choli", "fair-play", "anti-fair-play"], gradient: "from-fifa-purple via-fifa-blue to-fifa-teal" },
  { title: "Goleadores", icon: "⚽", ids: ["goleador", "balon-oro", "primer-gol-arg", "ultimo-gol-arg"], gradient: "from-emerald-600 via-teal-600 to-cyan-700" },
  { title: "Produsa", icon: "🎯", ids: ["primer-prode", "ultimo-prode"], gradient: "from-rose-600 via-pink-600 to-fuchsia-700" },
];

function AnswerRow({ g, totalUsers, isCorrect }: { g: AnswerGroup; totalUsers: number; isCorrect: boolean | null }) {
  const [expanded, setExpanded] = useState(false);
  const pct = totalUsers > 0 ? Math.round((g.count / totalUsers) * 100) : 0;

  return (
    <div className={cn(
      "rounded-xl ring-1 overflow-hidden",
      isCorrect === true ? "ring-emerald-300/50 bg-emerald-950/30" : "ring-white/15 bg-black/10",
    )}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 text-left"
      >
        <div className="mb-1.5 flex items-center justify-between">
          <span className={cn(
            "text-xs font-medium",
            isCorrect === true ? "text-emerald-300" : "text-white",
          )}>
            {g.answer} {isCorrect === true && "✓"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/60">{g.count} ({pct}%)</span>
            <svg
              className={cn("h-3.5 w-3.5 text-white/40 transition-transform duration-200", expanded && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              isCorrect === true ? "bg-emerald-300" : "bg-white/60",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3" style={{ animation: "slideDown 0.2s ease-out" }}>
          <div className="rounded-xl bg-black/20 p-2.5">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {g.users.map((u) => (
                <div key={u.userId} className={cn("flex flex-col items-center gap-1", isCorrect === false && "opacity-30")}>
                  <div className="rounded-full ring-2 ring-white/50">
                    <AvatarDisplay avatar={u.avatar} size="sm" />
                  </div>
                  <span className="text-[9px] text-white truncate max-w-full text-center">
                    {u.userName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCarousel({ questions, totalUsers }: { questions: BonusQuestion[]; totalUsers: number }) {
  const [current, setCurrent] = useState(0);
  const qIds = questions.map((q) => q.id).join(",");
  useEffect(() => { setCurrent(0); }, [qIds]);

  if (questions.length === 0) return null;
  const safeIndex = Math.min(current, questions.length - 1);
  const q = questions[safeIndex];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-full bg-black/20 p-1.5 text-white disabled:opacity-20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h4 className="text-sm font-semibold text-white">{q.label}</h4>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-fifa-lime">+{q.points} pts</span>
            {questions.length > 1 && (
              <span className="text-[10px] text-white/50">{current + 1}/{questions.length}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          disabled={current === questions.length - 1}
          className="rounded-full bg-black/20 p-1.5 text-white disabled:opacity-20"
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
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionData {
  title: string;
  icon: string;
  ids: string[];
  gradient: string;
  questions: BonusQuestion[];
}

function SectionCard({ section, index, totalUsers }: { section: SectionData; index: number; totalUsers: number }) {
  return (
    <div
      data-section-card
      data-index={index}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${section.gradient} p-5 text-white shadow-xl shadow-black/20`}
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-fifa-lime/10" />
      <div className="absolute -left-4 bottom-4 h-16 w-16 rounded-full bg-fifa-red/10" />
      <div className="absolute right-12 bottom-0 h-10 w-10 rounded-full bg-white/5" />
      <div className="relative">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white drop-shadow-sm">
          <span>{section.icon}</span>
          {section.title}
        </h2>
        <QuestionCarousel questions={section.questions} totalUsers={totalUsers} />
      </div>
    </div>
  );
}

export default function ExtraEPage() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetch("/api/extras")
      .then((r) => r.ok ? r.json() : { questions: [], totalUsers: 0 })
      .then((d) => { setQuestions(d.questions); setTotalUsers(d.totalUsers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scrollToSection = useCallback((idx: number) => {
    desktopRef.current
      ?.querySelectorAll("[data-section-card]")
      [idx]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const container = desktopRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>("[data-section-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveSection(idx);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [questions]);

  if (loading) return <div className="flex justify-center py-12 text-fifa-dark-gray">Cargando...</div>;

  const qMap = new Map(questions.map((q) => [q.id, q]));

  const sectionData = SECTIONS
    .map((section) => ({
      ...section,
      questions: section.ids.map((id) => qMap.get(id)).filter(Boolean) as BonusQuestion[],
    }))
    .filter((s) => s.questions.length > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Puntos Extra</h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">
          Predicciones de todos los participantes. Se resuelven al final del torneo.
        </p>
      </div>

      {/* Mobile: stacked */}
      <div className="mx-auto max-w-md space-y-6 md:hidden">
        {sectionData.map((section, i) => (
          <SectionCard key={section.title} section={section} index={i} totalUsers={totalUsers} />
        ))}
      </div>

      {/* Desktop: one section at a time with side arrows */}
      <div className="hidden md:block">
        <div className="mb-4 flex justify-center gap-2">
          {sectionData.map((section, i) => (
            <button
              key={section.title}
              type="button"
              onClick={() => setActiveSection(i)}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wide transition-all duration-200",
                i === activeSection
                  ? "bg-fifa-blue text-white"
                  : "bg-white/5 text-fifa-dark-gray hover:bg-white/10",
              )}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="flex items-start justify-center gap-4">
          <div className="flex-shrink-0 pt-52">
            <button
              type="button"
              onClick={() => setActiveSection((s) => s - 1)}
              disabled={activeSection === 0}
              className="rounded-full bg-white/5 p-2.5 text-foreground ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="max-w-lg flex-1">
            {sectionData[activeSection] && (
              <SectionCard section={sectionData[activeSection]} index={activeSection} totalUsers={totalUsers} />
            )}
          </div>
          <div className="flex-shrink-0 pt-52">
            <button
              type="button"
              onClick={() => setActiveSection((s) => s + 1)}
              disabled={activeSection === sectionData.length - 1}
              className="rounded-full bg-white/5 p-2.5 text-foreground ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
