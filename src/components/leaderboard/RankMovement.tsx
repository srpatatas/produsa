import { cn } from "@/lib/utils";

interface RankMovementProps {
  currentRank: number;
  previousRank: number | null;
}

export function RankMovement({ currentRank, previousRank }: RankMovementProps) {
  if (previousRank === null) {
    return <span className="text-xs text-fifa-dark-gray">–</span>;
  }

  const diff = previousRank - currentRank;

  if (diff === 0) {
    return <span className="text-xs text-fifa-dark-gray">＝</span>;
  }

  const isUp = diff > 0;

  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-semibold",
        isUp ? "text-fifa-green" : "text-fifa-red",
      )}
    >
      <span>{isUp ? "▲" : "▼"}</span>
      <span>{Math.abs(diff)}</span>
    </span>
  );
}
