interface RoundHeaderProps {
  label: string;
}

export function RoundHeader({ label }: RoundHeaderProps) {
  return (
    <div className="mb-4 px-2 text-center">
      <span className="font-display text-xs uppercase tracking-widest text-fifa-purple">
        {label}
      </span>
    </div>
  );
}
