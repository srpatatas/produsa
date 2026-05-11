"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { PredictionsMap } from "@/types";
import { loadPredictions, savePredictions } from "@/lib/predictions";
import { useUser } from "./UserContext";

interface PredictionsContextValue {
  predictions: PredictionsMap;
  isLoaded: boolean;
  setPrediction: (
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
  clearAllPredictions: () => void;
}

const PredictionsContext = createContext<PredictionsContextValue>({
  predictions: {},
  isLoaded: false,
  setPrediction: () => {},
  clearAllPredictions: () => {},
});

export function PredictionsProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [predictions, setPredictions] = useState<PredictionsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadPredictions(user.id);
    setPredictions(stored);
    setIsLoaded(true);
  }, [user.id]);

  useEffect(() => {
    if (!isLoaded) return;
    savePredictions(user.id, predictions);
  }, [predictions, isLoaded, user.id]);

  const setPrediction = useCallback(
    (matchId: string, homeScore: number, awayScore: number) => {
      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          matchId,
          homeScore,
          awayScore,
          timestamp: Date.now(),
        },
      }));
    },
    [],
  );

  const clearAllPredictions = useCallback(() => {
    setPredictions({});
  }, []);

  return (
    <PredictionsContext.Provider
      value={{ predictions, isLoaded, setPrediction, clearAllPredictions }}
    >
      {children}
    </PredictionsContext.Provider>
  );
}

export function usePredictions() {
  return useContext(PredictionsContext);
}
