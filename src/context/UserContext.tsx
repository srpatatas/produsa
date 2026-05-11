"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "@/types";

const mockUser: User = {
  id: "default-user",
  name: "Player 1",
  avatar: "⚽",
};

const UserContext = createContext<User>(mockUser);

export function UserProvider({ children }: { children: ReactNode }) {
  return <UserContext.Provider value={mockUser}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
