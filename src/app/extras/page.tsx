"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { FlagImage } from "@/components/teams/FlagImage";
import { teams } from "@/data/teams";
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

const SECTIONS = [
  { title: "Podio", icon: "🏆", ids: ["campeon", "subcampeon", "tercer-puesto"], gradient: "from-yellow-500/90 via-fifa-gold to-amber-500" },
  { title: "Equipos", icon: "🌍", ids: ["ultimo-mundial", "valla-menos", "valla-mas", "revelacion", "abuela-choli", "fair-play", "anti-fair-play"], gradient: "from-fifa-purple via-fifa-blue to-fifa-teal" },
  { title: "Jugadores", icon: "⚽", ids: ["goleador", "balon-oro", "primer-gol-arg", "ultimo-gol-arg"], gradient: "from-emerald-600 via-teal-600 to-cyan-700" },
  { title: "Produsa", icon: "🎯", ids: ["primer-prode", "ultimo-prode"], gradient: "from-rose-600 via-pink-600 to-fuchsia-700" },
  { title: "Eliminatorias", icon: "🥊", ids: ["golestotales-16vos", "posesion-caboverde"], gradient: "from-indigo-600 via-violet-600 to-purple-700" },
];

function AnswerLabel({ answer, sourceType, participants }: { answer: string; sourceType: string; participants: Record<string, string> }) {
  if (sourceType === "teams") {
    const team = teams[answer];
    if (team) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <FlagImage code={team.flagCode} name={team.name} size="sm" />
          <span className="font-display text-sm tracking-wider">{team.shortName}</span>
        </span>
      );
    }
  }
  if (sourceType === "players") {
    const match = answer.match(/^(.+?)\s*\((\w+)\)$/);
    if (match) {
      const [, name, teamId] = match;
      const team = teams[teamId];
      if (team) {
        return (
          <span className="inline-flex items-center gap-1.5">
            {name}
            <FlagImage code={team.flagCode} name={team.name} size="sm" />
          </span>
        );
      }
    }
  }
  if (sourceType === "participants") {
    const avatar = participants[answer];
    if (avatar) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <div className="rounded-full ring-1 ring-white/30">
            <AvatarDisplay avatar={avatar} size="xs" />
          </div>
          {answer}
        </span>
      );
    }
  }
  return <>{answer}</>;
}

function AnswerRow({ g, totalUsers, isCorrect, sourceType, participants }: { g: AnswerGroup; totalUsers: number; isCorrect: boolean | null; sourceType: string; participants: Record<string, string> }) {
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
            <AnswerLabel answer={g.answer} sourceType={sourceType} participants={participants} /> {isCorrect === true && "✓"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white/80">{g.count} ({pct}%)</span>
            <svg
              className={cn("h-3.5 w-3.5 text-white/80 transition-transform duration-200", expanded && "rotate-180")}
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

function flattenGuesses(question: BonusQuestion): Array<{ userId: number; userName: string; avatar: string; value: number }> {
  return question.grouped.flatMap((g) =>
    g.users.map((u) => ({ ...u, value: parseInt(g.answer, 10) || 0 })),
  );
}

function SortedValueList({ question }: { question: BonusQuestion }) {
  const guesses = flattenGuesses(question).sort((a, b) => b.value - a.value);
  if (guesses.length === 0) return <p className="text-center text-xs text-white/40">Sin pronósticos todavía</p>;

  const correctValue = question.correctAnswer ? parseInt(question.correctAnswer, 10) : null;

  return (
    <div className="space-y-1 max-h-52 overflow-y-auto">
      {guesses.map((g, i) => {
        const isClosest = correctValue !== null && guesses.every(
          (other) => Math.abs(g.value - correctValue) <= Math.abs(other.value - correctValue),
        );
        return (
          <div
            key={`${g.userId}-${i}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
              isClosest ? "bg-emerald-400/20 ring-1 ring-emerald-300/40" : "bg-black/15",
            )}
          >
            <div className="rounded-full ring-1 ring-white/30">
              <AvatarDisplay avatar={g.avatar} size="xs" />
            </div>
            <span className="flex-1 text-xs text-white truncate">{g.userName}</span>
            <span className={cn(
              "font-display text-sm tracking-wider",
              isClosest ? "text-emerald-300" : "text-white",
            )}>
              {g.value}
            </span>
            {isClosest && <span className="text-[10px]">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

function PossessionBar({ question }: { question: BonusQuestion }) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const guesses = flattenGuesses(question).sort((a, b) => a.value - b.value);
  if (guesses.length === 0) return <p className="text-center text-xs text-white/40">Sin pronósticos todavía</p>;

  const cpv = teams["CPV"];
  const arg = teams["ARG"];
  const correctValue = question.correctAnswer ? parseInt(question.correctAnswer, 10) : null;
  const minVal = Math.max(0, Math.min(...guesses.map((g) => g.value)) - 5);
  const maxVal = Math.min(100, Math.max(...guesses.map((g) => g.value)) + 5);
  const range = maxVal - minVal || 1;

  return (
    <div className="pt-10 pb-2">
      <div className="relative">
        {/* Avatars above the bar */}
        <div className="absolute -top-9 left-0 right-0">
          {guesses.map((g, i) => {
            const pct = ((g.value - minVal) / range) * 100;
            const isClosest = correctValue !== null && guesses.every(
              (other) => Math.abs(g.value - correctValue) <= Math.abs(other.value - correctValue),
            );
            return (
              <div
                key={`${g.userId}-${i}`}
                className="absolute -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                  className={cn(
                    "block rounded-full ring-2 transition-transform hover:scale-110",
                    isClosest ? "ring-emerald-300 shadow-lg shadow-emerald-300/30" : "ring-white/40",
                  )}
                >
                  <AvatarDisplay avatar={g.avatar} size="xs" />
                </button>
                {activeTooltip === i && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-50 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white shadow-lg">
                    {g.userName}: {g.value}%
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 bg-black/80" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Possession bar */}
        <div className="flex h-3 overflow-hidden rounded-full">
          <div className="bg-teal-600" style={{ width: "50%" }} />
          <div className="bg-sky-400" style={{ width: "50%" }} />
        </div>

        {/* Correct answer marker */}
        {correctValue !== null && (
          <div
            className="absolute top-0 h-3 w-0.5 bg-emerald-300 shadow-lg shadow-emerald-300/50"
            style={{ left: `${((correctValue - minVal) / range) * 100}%` }}
          />
        )}

        {/* Scale labels */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FlagImage code={cpv.flagCode} name={cpv.name} size="sm" />
            <span className="text-[11px] font-semibold text-white">{minVal}%</span>
          </div>
          <span className="text-[9px] text-white/40 uppercase tracking-wider">Posesión CPV</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-white">{maxVal}%</span>
            <FlagImage code={arg.flagCode} name={arg.name} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCarousel({ questions, totalUsers, participants }: { questions: BonusQuestion[]; totalUsers: number; participants: Record<string, string> }) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const locked = useRef<"h" | "v" | null>(null);
  const qIds = questions.map((q) => q.id).join(",");
  useEffect(() => { setCurrent(0); }, [qIds]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    locked.current = null;
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!locked.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        locked.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      return;
    }
    if (locked.current === "v") return;
    e.preventDefault();
    setDragOffset(dx);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const threshold = 60;
    if (locked.current === "h" && Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) setCurrent((c) => Math.min(questions.length - 1, c + 1));
      else setCurrent((c) => Math.max(0, c - 1));
    }
    setDragOffset(0);
  }, [dragOffset, questions.length]);

  if (questions.length === 0) return null;
  const safeIndex = Math.min(current, questions.length - 1);
  const q = questions[safeIndex];

  const containerRef = useRef<HTMLDivElement>(null);
  const pctOffset = -(safeIndex * 100);
  const pxOffset = isDragging && locked.current === "h" ? dragOffset : 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: "translateX(calc(" + pctOffset + "% + " + pxOffset + "px))",
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          {questions.map((question) => (
            <div key={question.id} className="w-full flex-shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={safeIndex === 0}
                  className="rounded-full bg-black/20 p-1.5 text-white disabled:opacity-20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-white">{question.label}</h4>
                  {question.sourceType === "exact_value" && (
                    <p className="text-[10px] text-white/60 mt-0.5">Gana el más cercano al valor real</p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-semibold text-white">+{question.points} pts</span>
                    {questions.length > 1 && (
                      <span className="text-[11px] font-semibold text-white/80">{safeIndex + 1}/{questions.length}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  disabled={safeIndex === questions.length - 1}
                  className="rounded-full bg-black/20 p-1.5 text-white disabled:opacity-20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {question.id === "golestotales-16vos" ? (
                <SortedValueList question={question} />
              ) : question.id === "posesion-caboverde" ? (
                <PossessionBar question={question} />
              ) : (
                <div className="space-y-2.5">
                  {question.grouped.map((g) => (
                    <AnswerRow key={g.answer} g={g} totalUsers={totalUsers} isCorrect={question.correctAnswer ? g.answer === question.correctAnswer : null} sourceType={question.sourceType} participants={participants} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
                i === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/30",
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

function SectionCard({ section, index, totalUsers, participants }: { section: SectionData; index: number; totalUsers: number; participants: Record<string, string> }) {
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
        <QuestionCarousel questions={section.questions} totalUsers={totalUsers} participants={participants} />
      </div>
    </div>
  );
}

export default function ExtraEPage() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [participants, setParticipants] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetch("/api/extras")
      .then((r) => r.ok ? r.json() : { questions: [], totalUsers: 0 })
      .then((d) => { setQuestions(d.questions); setTotalUsers(d.totalUsers); setParticipants(d.participants ?? {}); })
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
          Pronósticos de puntos extra de todos los participantes. Se resuelven al final del torneo.
        </p>
      </div>

      {/* Mobile: stacked sections */}
      <div className="mx-auto max-w-md space-y-6 md:hidden">
        {sectionData.map((section, i) => (
          <SectionCard key={section.title} section={section} index={i} totalUsers={totalUsers} participants={participants} />
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
              <SectionCard section={sectionData[activeSection]} index={activeSection} totalUsers={totalUsers} participants={participants} />
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
