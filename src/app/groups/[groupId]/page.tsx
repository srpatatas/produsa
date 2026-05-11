import { notFound } from "next/navigation";
import Link from "next/link";
import { GroupId } from "@/types";
import { getGroup } from "@/data/groups";
import { getMatchesForGroup } from "@/data/matches";
import { MatchList } from "@/components/matches/MatchList";
import { StandingsTable } from "@/components/groups/StandingsTable";

const validGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const groupGradients: Record<GroupId, string> = {
  A: "from-fifa-green to-fifa-teal",
  B: "from-fifa-red to-rose-600",
  C: "from-fifa-blue to-indigo-600",
  D: "from-fifa-purple to-fuchsia-600",
  E: "from-amber-500 to-fifa-gold",
  F: "from-fifa-teal to-cyan-500",
  G: "from-fifa-red to-fifa-purple",
  H: "from-fifa-blue to-fifa-green",
  I: "from-fifa-purple to-fifa-blue",
  J: "from-fifa-green to-lime-500",
  K: "from-fifa-gold to-amber-600",
  L: "from-fifa-red to-fifa-blue",
};

export function generateStaticParams() {
  return validGroups.map((groupId) => ({ groupId }));
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const upperGroupId = groupId.toUpperCase();

  if (!validGroups.includes(upperGroupId)) {
    notFound();
  }

  const group = getGroup(upperGroupId)!;
  const matches = getMatchesForGroup(upperGroupId);
  const gradient = groupGradients[group.id];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/pronosticos"
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-fifa-dark-gray transition-colors hover:bg-white/10 hover:text-foreground"
        >
          ← Pronósticos
        </Link>
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <span className="font-display text-2xl tracking-wider text-white">
              {group.id}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Grupo {group.id}
            </h1>
            <p className="text-sm text-fifa-dark-gray">
              Ingresá tus predicciones para cada partido
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
            Posiciones
          </h2>
          <StandingsTable
            teamIds={[...group.teams]}
            matches={matches}
          />
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
            Partidos
          </h2>
          <MatchList matches={matches} />
        </section>
      </div>
    </div>
  );
}
