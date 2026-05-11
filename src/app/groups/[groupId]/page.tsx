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
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-fifa-dark-gray transition-colors hover:bg-fifa-blue/10 hover:text-fifa-blue"
        >
          ← Todos los Grupos
        </Link>
        <h1 className="flex items-center gap-3">
          <span className="font-display text-3xl tracking-wider text-fifa-blue">
            GRUPO {group.id}
          </span>
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          Ingresá tus predicciones para cada partido
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
            Posiciones
          </h2>
          <StandingsTable
            teamIds={[...group.teams]}
            matches={matches}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
            Partidos
          </h2>
          <MatchList matches={matches} />
        </section>
      </div>
    </div>
  );
}
