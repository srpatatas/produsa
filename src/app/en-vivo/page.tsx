"use client";

import { LiveMatchView } from "@/components/live/LiveMatchView";

export default function EnVivoPage() {
  return (
    <LiveMatchView
      onNoLiveMatches={() => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-fifa-purple/10 to-fifa-teal/10" />
            <span className="relative text-6xl">📺</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            No hay partidos en vivo
          </h1>
          <p className="mt-2 max-w-xs text-sm text-fifa-dark-gray">
            Cuando un partido esté en juego, vas a poder ver el marcador y las
            predicciones de todos acá.
          </p>
        </div>
      )}
    />
  );
}
