"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { PlanillaPredictionsMap, PlanillaOutcome, BonusPredictionsMap } from "@/types";

interface PlanillaContextValue {
  predictions: PlanillaPredictionsMap;
  bonusPredictions: BonusPredictionsMap;
  isLoaded: boolean;
  setPrediction: (matchId: string, outcome: PlanillaOutcome) => void;
  removePrediction: (matchId: string) => void;
  setBonusPrediction: (questionId: string, value: string) => void;
  getDoubleMatchId: (matchday: number, matchIds: string[]) => string | null;
}

const PlanillaContext = createContext<PlanillaContextValue>({
  predictions: {},
  bonusPredictions: {},
  isLoaded: false,
  setPrediction: () => {},
  removePrediction: () => {},
  setBonusPrediction: () => {},
  getDoubleMatchId: () => null,
});

export function PlanillaProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<PlanillaPredictionsMap>({});
  const [bonusPredictions, setBonusPredictions] = useState<BonusPredictionsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [predRes, bonusRes] = await Promise.all([
          fetch("/api/predictions"),
          fetch("/api/bonus"),
        ]);
        if (predRes.ok) {
          const data = await predRes.json();
          setPredictions(data.predictions);
        }
        if (bonusRes.ok) {
          const data = await bonusRes.json();
          setBonusPredictions(data.predictions);
        }
      } catch {
        // Offline or error
      }
      setIsLoaded(true);
    }
    loadAll();
  }, []);

  const setPrediction = useCallback(
    (matchId: string, outcome: PlanillaOutcome) => {
      setPredictions((prev) => ({
        ...prev,
        [matchId]: { matchId, outcome },
      }));
      fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, outcome }),
      }).catch(() => {});
    },
    [],
  );

  const removePrediction = useCallback((matchId: string) => {
    setPredictions((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    fetch("/api/predictions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    }).catch(() => {});
  }, []);

  const setBonusPrediction = useCallback(
    (questionId: string, value: string) => {
      setBonusPredictions((prev) => ({ ...prev, [questionId]: value }));
      fetch("/api/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: value }),
      }).catch(() => {});
    },
    [],
  );

  const getDoubleMatchId = useCallback(
    (_matchday: number, matchIds: string[]): string | null => {
      for (const id of matchIds) {
        const pred = predictions[id];
        if (pred && pred.outcome.length === 2) return id;
      }
      return null;
    },
    [predictions],
  );

  return (
    <PlanillaContext.Provider
      value={{
        predictions,
        bonusPredictions,
        isLoaded,
        setPrediction,
        removePrediction,
        setBonusPrediction,
        getDoubleMatchId,
      }}
    >
      {children}
    </PlanillaContext.Provider>
  );
}

export function usePlanilla() {
  return useContext(PlanillaContext);
}
