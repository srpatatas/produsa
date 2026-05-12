import { mockLeaderboard } from "@/data/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export default function RankingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ranking
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          Tabla de posiciones entre los jugadores
        </p>
      </div>
      <LeaderboardTable entries={mockLeaderboard} />
    </div>
  );
}
