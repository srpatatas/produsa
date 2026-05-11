import { notFound } from "next/navigation";
import Link from "next/link";
import { getGroup } from "@/data/groups";
import { getMatchesForGroup } from "@/data/matches";
import { MatchList } from "@/components/matches/MatchList";
import { StandingsTable } from "@/components/groups/StandingsTable";

const validGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-fifa-dark-gray transition-colors hover:text-fifa-blue"
        >
          ← Todos los Grupos
        </Link>
        <h1 className="font-display text-2xl font-bold text-fifa-blue sm:text-3xl">
          Grupo {group.id}
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          Ingresá tus predicciones para cada partido
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Posiciones
          </h2>
          <StandingsTable
            teamIds={[...group.teams]}
            matches={matches}
          />
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Partidos
          </h2>
          <MatchList matches={matches} />
        </section>
      </div>
    </div>
  );
}
