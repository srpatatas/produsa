interface RoundHeaderProps {
  label: string;
}

export function RoundHeader({ label }: RoundHeaderProps) {
  return (
    <div className="mb-3 text-center">
      <span className="font-display text-[10px] uppercase tracking-widest text-fifa-dark-gray">
        {label}
      </span>
    </div>
  );
}
