"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "@/types";

const fallbackUser: User = {
  id: 0,
  name: "Invitado",
  avatar: "⚽",
};

const UserContext = createContext<User>(fallbackUser);

export function UserProvider({
  user,
  children,
}: {
  user?: User | null;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={user ?? fallbackUser}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
