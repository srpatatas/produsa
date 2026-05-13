"use client";

import { ReactNode } from "react";
import { User } from "@/types";
import { UserProvider } from "@/context/UserContext";
import { PredictionsProvider } from "@/context/PredictionsContext";
import { PlanillaProvider } from "@/context/PlanillaContext";

export function Providers({
  user,
  children,
}: {
  user?: User | null;
  children: ReactNode;
}) {
  return (
    <UserProvider user={user}>
      <PredictionsProvider>
        <PlanillaProvider>{children}</PlanillaProvider>
      </PredictionsProvider>
    </UserProvider>
  );
}
