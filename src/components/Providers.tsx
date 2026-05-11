"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import { PredictionsProvider } from "@/context/PredictionsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <PredictionsProvider>{children}</PredictionsProvider>
    </UserProvider>
  );
}
