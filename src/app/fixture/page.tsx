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
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <FixtureGroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
