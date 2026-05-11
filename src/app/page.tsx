import { GroupGrid } from "@/components/groups/GroupGrid";
import { HeroBanner } from "@/components/layout/HeroBanner";

export default function Home() {
  return (
    <div>
      <HeroBanner subtitle="Predecí los resultados de todos los partidos" />
      <GroupGrid />
    </div>
  );
}
