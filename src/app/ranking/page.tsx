import { mockLeaderboard } from "@/data/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export default function RankingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-fifa-blue sm:text-3xl">
          Ranking
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          Tabla de posiciones entre los jugadores
        </p>
      </div>
      <LeaderboardTable entries={mockLeaderboard} />
    </div>
  );
}
