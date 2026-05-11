import { HeroBanner } from "@/components/layout/HeroBanner";
import { NextMatchCountdown } from "@/components/home/NextMatchCountdown";

export default function Home() {
  return (
    <div>
      <HeroBanner />
      <div className="space-y-6">
        <NextMatchCountdown />
      </div>
    </div>
  );
}
