import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
