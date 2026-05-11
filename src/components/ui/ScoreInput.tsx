"use client";

interface ScoreInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function ScoreInput({ value, onChange }: ScoreInputProps) {
  const displayValue = value !== undefined ? value : "";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-fifa-blue/10 text-sm font-bold text-fifa-blue transition-colors hover:bg-fifa-blue/20 active:bg-fifa-blue active:text-white"
      >
        −
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
        className="h-11 w-13 rounded-xl border-2 border-fifa-blue/20 bg-white text-center font-display text-2xl text-foreground outline-none transition-colors focus:border-fifa-blue focus:ring-2 focus:ring-fifa-blue/20"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(99, (value ?? 0) + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-fifa-blue/10 text-sm font-bold text-fifa-blue transition-colors hover:bg-fifa-blue/20 active:bg-fifa-blue active:text-white"
      >
        +
      </button>
    </div>
  );
}
