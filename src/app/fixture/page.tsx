import { groups } from "@/data/groups";
import { FixtureGroupCard } from "@/components/fixture/FixtureGroupCard";

export default function FixturePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Fixture
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          Fase de grupos · Resultados y posiciones oficiales
        </p>
        <div className="mt-3 flex items-center gap-4 text-[11px] text-fifa-dark-gray">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded bg-fifa-green/10 ring-1 ring-fifa-green/20" />
            Acertaste
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded bg-fifa-red/5 ring-1 ring-fifa-red/10" />
            Fallaste
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded ring-1 ring-white/5" />
            Sin resultado
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <FixtureGroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
