"use client";

import { ReactNode } from "react";
import { User } from "@/types";
import { UserProvider } from "@/context/UserContext";
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
      <PlanillaProvider>{children}</PlanillaProvider>
    </UserProvider>
  );
}
