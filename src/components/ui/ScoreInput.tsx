"use client";

interface ScoreInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function ScoreInput({ value, onChange }: ScoreInputProps) {
  const displayValue = value !== undefined ? value : "";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.min(99, (value ?? 0) + 1))}
        className="flex h-6 w-10 items-center justify-center rounded-lg text-fifa-dark-gray/40 transition-colors hover:bg-surface hover:text-fifa-blue"
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 6.5L6 1.5L11 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <input
        type="number"
        min={0}
        max={99}
        value={displayValue}
        onChange={(e) => {
          const num = parseInt(e.target.value, 10);
          if (!isNaN(num) && num >= 0 && num <= 99) onChange(num);
          if (e.target.value === "") onChange(0);
        }}
        className="h-12 w-14 rounded-xl bg-surface text-center font-display text-3xl text-foreground outline-none transition-all focus:bg-white focus:ring-2 focus:ring-fifa-blue/30 focus:shadow-lg"
      />
      <button
        type="button"
        onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}
        className="flex h-6 w-10 items-center justify-center rounded-lg text-fifa-dark-gray/40 transition-colors hover:bg-surface hover:text-fifa-blue"
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}
