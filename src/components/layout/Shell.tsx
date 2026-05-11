import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { HeroBanner } from "./HeroBanner";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:pb-8">
        <HeroBanner />
        {children}
      </main>
      <BottomNav />
    </>
  );
}
