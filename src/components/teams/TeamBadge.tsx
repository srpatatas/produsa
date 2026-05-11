import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";

interface TeamBadgeProps {
  teamId: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

const textClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function TeamBadge({
  teamId,
  size = "md",
  showName = true,
}: TeamBadgeProps) {
  const team = getTeam(teamId);

  return (
    <div className="flex items-center gap-2">
      <span className={sizeClasses[size]}>{getFlagEmoji(team.flagCode)}</span>
      {showName && (
        <span className={`font-medium ${textClasses[size]}`}>{team.name}</span>
      )}
    </div>
  );
}
