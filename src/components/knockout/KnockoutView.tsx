"use client";

import { useState } from "react";
import { KnockoutRound } from "@/types";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { knockoutRounds } from "@/data/knockoutBracket";
import { RoundTabs } from "./RoundTabs";
import { KnockoutMatchCard } from "./KnockoutMatchCard";
import { KnockoutStats } from "./KnockoutStats";
import { BracketView } from "./bracket/BracketView";

export function KnockoutView() {
  const [activeRound, setActiveRound] = useState<KnockoutRound>("R32");
  const matches = getKnockoutMatchesByRound(activeRound);
  const roundInfo = knockoutRounds.find((r) => r.id === activeRound);

  return (
    <div className="space-y-4">
      {/* Mobile: stats + tabs + card list */}
      <div className="md:hidden">
        <div className="space-y-4">
          <KnockoutStats />
          <RoundTabs active={activeRound} onChange={setActiveRound} />
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              {roundInfo?.label}
            </h2>
            <div className="space-y-3">
              {matches.map((match) => (
                <KnockoutMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: full bracket */}
      <BracketView />
    </div>
  );
}
