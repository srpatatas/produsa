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
  lockScope: string;
  correctAnswer: string | null;
  totalPredictions: number;
  grouped: AnswerGroup[];
}

const SECTIONS = [
  { title: "Podio", icon: "🏆", ids: ["campeon", "subcampeon", "tercer-puesto"], gradient: "from-yellow-500/90 via-fifa-gold to-amber-500" },
  { title: "Equipos", icon: "🌍", ids: ["ultimo-mundial", "valla-menos", "valla-mas", "revelacion", "abuela-choli", "fair-play", "anti-fair-play"], gradient: "from-fifa-purple via-fifa-blue to-fifa-teal" },
  { title: "Jugadores", icon: "⚽", ids: ["goleador", "balon-oro", "primer-gol-arg", "ultimo-gol-arg"], gradient: "from-emerald-600 via-teal-600 to-cyan-700" },
  { title: "Produsa", icon: "🎯", ids: ["primer-prode", "ultimo-prode"], gradient: "from-rose-600 via-pink-600 to-fuchsia-700" },
  { title: "Eliminatorias", icon: "🥊", ids: ["golestotales-16vos", "posesion-caboverde", "pases-marruecos", "ck-francia", "tarjetas-octavos", "faltas-franciamarruecos", "offsides-belgicaspain", "goles-cuartos"], gradient: "from-indigo-600 via-violet-600 to-purple-700" },
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
      isCorrect === false && "opacity-30",
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

function SortedValueList({ question, suffix }: { question: BonusQuestion; suffix?: string }) {
  const guesses = flattenGuesses(question).sort((a, b) => b.value - a.value);
  if (guesses.length === 0) return <p className="text-center text-xs text-white/40">Sin pronósticos todavía</p>;

  const correctValue = question.correctAnswer ? parseInt(question.correctAnswer, 10) : null;

  const hasResult = correctValue !== null;

  return (
    <div className="space-y-1 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/40">
      {guesses.map((g, i) => {
        const isClosest = hasResult && guesses.every(
          (other) => Math.abs(g.value - correctValue!) <= Math.abs(other.value - correctValue!),
        );
        return (
          <div
            key={`${g.userId}-${i}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
              isClosest ? "bg-emerald-400/20 ring-1 ring-emerald-300/40" : "bg-black/15",
              hasResult && !isClosest && "opacity-30",
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
              {g.value}{suffix}
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

  // Assign each avatar to top or bottom, staggering within each side
  const AVATAR_WIDTH_PCT = 8;
  const rowHeight = 32;
  const topSlots: number[] = []; // row index per avatar placed on top
  const bottomSlots: number[] = []; // row index per avatar placed on bottom
  const side: ("top" | "bottom")[] = [];
  const rowIndex: number[] = [];

  for (let i = 0; i < guesses.length; i++) {
    const pct = guesses[i].value;
    const tryPlace = (slotArr: number[], sideLabel: "top" | "bottom") => {
      for (let r = 0; r < 3; r++) {
        const conflict = guesses.some((_, j) => j < i && side[j] === sideLabel && rowIndex[j] === r && Math.abs(guesses[j].value - pct) < AVATAR_WIDTH_PCT);
        if (!conflict) return r;
      }
      return -1;
    };
    // Alternate: even index tries top first, odd tries bottom first
    const first = i % 2 === 0 ? "top" : "bottom";
    const second = first === "top" ? "bottom" : "top";
    const firstArr = first === "top" ? topSlots : bottomSlots;
    const secondArr = second === "top" ? topSlots : bottomSlots;

    let r = tryPlace(firstArr, first);
    if (r >= 0) {
      side.push(first);
      rowIndex.push(r);
      firstArr.push(r);
    } else {
      r = tryPlace(secondArr, second);
      side.push(second);
      rowIndex.push(Math.max(r, 0));
      secondArr.push(Math.max(r, 0));
    }
  }

  const maxTopRow = topSlots.length > 0 ? Math.max(...topSlots, 0) : 0;
  const maxBottomRow = bottomSlots.length > 0 ? Math.max(...bottomSlots, 0) : 0;
  const topHeight = topSlots.length > 0 ? (maxTopRow + 1) * rowHeight : 0;
  const bottomHeight = bottomSlots.length > 0 ? (maxBottomRow + 1) * rowHeight : 0;

  return (
    <div className="pb-2">
      {/* Avatars above the bar */}
      {topHeight > 0 && (
        <div className="relative mb-1" style={{ height: `${topHeight}px` }}>
          {guesses.map((g, i) => {
            if (side[i] !== "top") return null;
            const isClosest = correctValue !== null && guesses.every(
              (other) => Math.abs(g.value - correctValue) <= Math.abs(other.value - correctValue),
            );
            const bottomOffset = rowIndex[i] * rowHeight;
            return (
              <div key={`${g.userId}-${i}`} className="absolute -translate-x-1/2" style={{ left: `${g.value}%`, bottom: `${bottomOffset}px` }}>
                <button type="button" onClick={() => setActiveTooltip(activeTooltip === i ? null : i)} className={cn("block rounded-full ring-2 transition-transform hover:scale-110", isClosest ? "ring-emerald-300 shadow-lg shadow-emerald-300/30" : "ring-white/40")}>
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
      )}

      {/* Bar + labels */}
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          <div className="bg-teal-600" style={{ width: "50%" }} />
          <div className="bg-sky-400" style={{ width: "50%" }} />
        </div>
        {correctValue !== null && (
          <div className="absolute top-0 h-3 w-0.5 bg-emerald-300 shadow-lg shadow-emerald-300/50" style={{ left: `${correctValue}%` }} />
        )}
      </div>

      {/* Avatars below the bar */}
      {bottomHeight > 0 && (
        <div className="relative mt-1" style={{ height: `${bottomHeight}px` }}>
          {guesses.map((g, i) => {
            if (side[i] !== "bottom") return null;
            const isClosest = correctValue !== null && guesses.every(
              (other) => Math.abs(g.value - correctValue) <= Math.abs(other.value - correctValue),
            );
            const topOffset = rowIndex[i] * rowHeight;
            return (
              <div key={`${g.userId}-${i}`} className="absolute -translate-x-1/2" style={{ left: `${g.value}%`, top: `${topOffset}px` }}>
                <button type="button" onClick={() => setActiveTooltip(activeTooltip === i ? null : i)} className={cn("block rounded-full ring-2 transition-transform hover:scale-110", isClosest ? "ring-emerald-300 shadow-lg shadow-emerald-300/30" : "ring-white/40")}>
                  <AvatarDisplay avatar={g.avatar} size="xs" />
                </button>
                {activeTooltip === i && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-50 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white shadow-lg">
                    {g.userName}: {g.value}%
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 bg-black/80" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Team labels */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FlagImage code={cpv.flagCode} name={cpv.name} size="sm" />
          <span className="font-display text-xs tracking-wider text-white">CPV</span>
        </div>
        <span className="text-[9px] text-white/40">50%</span>
        <div className="flex items-center gap-1.5">
          <span className="font-display text-xs tracking-wider text-white">ARG</span>
          <FlagImage code={arg.flagCode} name={arg.name} size="sm" />
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
                  <h4 className="text-sm font-semibold text-white">
                    {question.label}
                    {question.sourceType === "exact_value" && question.correctAnswer && (
                      <span className="text-emerald-300"> = {question.correctAnswer}</span>
                    )}
                  </h4>
                  {question.sourceType === "exact_value" && !question.correctAnswer && (
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
              {question.sourceType === "exact_value" ? (
                <SortedValueList question={question} suffix={question.id === "posesion-caboverde" ? "%" : undefined} />
              ) : (
                <div className="space-y-2.5">
                  {question.grouped.map((g) => (
                    <AnswerRow key={g.answer} g={g} totalUsers={totalUsers} isCorrect={question.correctAnswer ? question.correctAnswer.split(",").map((s) => s.trim()).includes(g.answer) : null} sourceType={question.sourceType} participants={participants} />
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
  const [locks, setLocks] = useState<Record<string, { locksAt: string; isLocked: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/extras").then((r) => r.ok ? r.json() : { questions: [], totalUsers: 0 }),
      fetch("/api/locks").then((r) => r.ok ? r.json() : { locks: {} }),
    ]).then(([extrasData, lockData]) => {
      setQuestions(extrasData.questions);
      setTotalUsers(extrasData.totalUsers);
      setParticipants(extrasData.participants ?? {});
      setLocks(lockData.locks);
    }).catch(() => {})
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

  const knockoutScopes = new Set(["R32", "R16", "QF", "SF", "FINAL"]);
  const visibleQuestions = questions.filter((q) =>
    !knockoutScopes.has(q.lockScope) || locks[q.lockScope]?.isLocked,
  );
  const qMap = new Map(visibleQuestions.map((q) => [q.id, q]));

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
