import { PlanillaView } from "@/components/planillas/PlanillaView";

export default function PlanillasPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Planillas
        </h1>
        <p className="mt-1 text-sm text-fifa-dark-gray">
          Completá tu planilla para cada fecha · 1 doble por fecha
        </p>
      </div>
      <PlanillaView />
    </div>
  );
}
