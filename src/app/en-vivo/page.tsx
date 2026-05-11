"use client";

import { LiveMatchView } from "@/components/live/LiveMatchView";

export default function EnVivoPage() {
  return (
    <LiveMatchView
      onNoLiveMatches={() => (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-3 text-5xl">📺</span>
          <h1 className="font-display text-xl font-bold text-fifa-blue">
            No hay partidos en vivo
          </h1>
          <p className="mt-2 text-sm text-fifa-dark-gray">
            Cuando un partido esté en juego, vas a poder ver el marcador y las
            predicciones de todos acá.
          </p>
        </div>
      )}
    />
  );
}
