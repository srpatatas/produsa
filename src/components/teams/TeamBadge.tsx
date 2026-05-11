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

const codeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
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
        <div className="flex items-baseline gap-1.5">
          <span className={`font-display tracking-wide ${codeClasses[size]}`}>
            {team.shortName}
          </span>
          <span className={`text-fifa-dark-gray ${textClasses[size]}`}>
            {team.name}
          </span>
        </div>
      )}
    </div>
  );
}
