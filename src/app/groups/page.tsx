import { GroupGrid } from "@/components/groups/GroupGrid";

export default function GroupsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-fifa-blue sm:text-3xl">
          Fase de Grupos
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          12 grupos · 48 equipos · 72 partidos
        </p>
      </div>
      <GroupGrid />
    </div>
  );
}
