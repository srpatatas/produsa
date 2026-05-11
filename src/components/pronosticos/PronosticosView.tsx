"use client";

import { useState } from "react";
import { ViewToggle } from "./ViewToggle";
import { GroupGrid } from "@/components/groups/GroupGrid";
import { PredictionStats } from "@/components/groups/PredictionStats";
import { KnockoutView } from "@/components/knockout/KnockoutView";

export function PronosticosView() {
  const [view, setView] = useState<"grupos" | "eliminatorias">("grupos");

  return (
    <div className="space-y-5">
      <ViewToggle active={view} onChange={setView} />
      {view === "grupos" ? (
        <>
          <PredictionStats />
          <GroupGrid />
        </>
      ) : (
        <KnockoutView />
      )}
    </div>
  );
}
