import { GroupGrid } from "@/components/groups/GroupGrid";

export default function PronosticosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pronósticos
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          12 grupos · 48 equipos · 72 partidos
        </p>
      </div>
      <GroupGrid />
    </div>
  );
}
