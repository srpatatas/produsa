import { GroupGrid } from "@/components/groups/GroupGrid";
import { HeroBanner } from "@/components/layout/HeroBanner";

export default function GroupsPage() {
  return (
    <div>
      <HeroBanner subtitle="12 grupos · 48 equipos · 72 partidos" />
      <GroupGrid />
    </div>
  );
}
