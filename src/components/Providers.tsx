"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import { PredictionsProvider } from "@/context/PredictionsContext";
import { PlanillaProvider } from "@/context/PlanillaContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <PredictionsProvider>
        <PlanillaProvider>{children}</PlanillaProvider>
      </PredictionsProvider>
    </UserProvider>
  );
}
