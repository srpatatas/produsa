"use client";

import { useState } from "react";
import { KnockoutMatch } from "@/types";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { BracketMatchNode } from "./BracketMatchNode";
import { BracketPredictionModal } from "./BracketPredictionModal";
import { RoundHeader } from "./RoundHeader";
import { KnockoutStats } from "../KnockoutStats";

const BRACKET_HEIGHT = 1200;

function RoundColumn({
  matches,
  onMatchClick,
}: {
  matches: KnockoutMatch[];
  onMatchClick: (match: KnockoutMatch) => void;
}) {
  return (
    <div
      className="flex flex-col justify-around px-2"
      style={{ height: BRACKET_HEIGHT }}
    >
      {matches.map((match) => (
        <BracketMatchNode
          key={match.id}
          match={match}
          onClick={() => onMatchClick(match)}
        />
      ))}
    </div>
  );
}

function ConnectorColumn({ pairCount }: { pairCount: number }) {
  return (
    <div
      className="flex w-10 flex-col justify-around"
      style={{ height: BRACKET_HEIGHT }}
    >
      {Array.from({ length: pairCount }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col justify-center">
          <div className="flex-1 border-b border-r border-white/10 rounded-br-lg" />
          <div className="flex-1 border-t border-r border-white/10 rounded-tr-lg" />
        </div>
      ))}
    </div>
  );
}

export function BracketView() {
  const [selectedMatch, setSelectedMatch] = useState<KnockoutMatch | null>(null);

  const r32 = getKnockoutMatchesByRound("R32");
  const r16 = getKnockoutMatchesByRound("R16");
  const qf = getKnockoutMatchesByRound("QF");
  const sf = getKnockoutMatchesByRound("SF");
  const final = getKnockoutMatchesByRound("F");
  const thirdPlace = getKnockoutMatchesByRound("3P");

  return (
    <div className="hidden md:block">
      <div className="mb-4">
        <KnockoutStats />
      </div>

      <div className="-mx-4 overflow-x-auto bracket-scroll px-4 pb-6">
        <div className="inline-flex min-w-[1400px]">
          {/* R32 */}
          <div>
            <RoundHeader label="Dieciseisavos" />
            <RoundColumn matches={r32} onMatchClick={setSelectedMatch} />
          </div>

          <ConnectorColumn pairCount={8} />

          {/* R16 */}
          <div>
            <RoundHeader label="Octavos" />
            <RoundColumn matches={r16} onMatchClick={setSelectedMatch} />
          </div>

          <ConnectorColumn pairCount={4} />

          {/* QF */}
          <div>
            <RoundHeader label="Cuartos" />
            <RoundColumn matches={qf} onMatchClick={setSelectedMatch} />
          </div>

          <ConnectorColumn pairCount={2} />

          {/* SF */}
          <div>
            <RoundHeader label="Semis" />
            <RoundColumn matches={sf} onMatchClick={setSelectedMatch} />
          </div>

          <ConnectorColumn pairCount={1} />

          {/* Final + 3P */}
          <div>
            <RoundHeader label="Final" />
            <div
              className="flex flex-col items-center px-2"
              style={{ height: BRACKET_HEIGHT }}
            >
              <div className="flex flex-1 items-center">
                <BracketMatchNode
                  match={final[0]}
                  onClick={() => setSelectedMatch(final[0])}
                />
              </div>
              <div className="flex flex-col items-center gap-3 pb-8">
                <span className="font-display text-[10px] uppercase tracking-widest text-fifa-gold">
                  Tercer puesto
                </span>
                <BracketMatchNode
                  match={thirdPlace[0]}
                  onClick={() => setSelectedMatch(thirdPlace[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedMatch && (
        <BracketPredictionModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
