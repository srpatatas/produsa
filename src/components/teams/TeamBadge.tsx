import { getTeam } from "@/data/teams";
import { FlagImage } from "./FlagImage";

interface TeamBadgeProps {
  teamId: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const flagSizes = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "lg" as const,
};

const codeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
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
    <div className="flex items-center gap-2.5">
      <FlagImage code={team.flagCode} name={team.name} size={flagSizes[size]} />
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
