"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { PlanillaPrediction, PlanillaPredictionsMap, PlanillaOutcome, BonusPredictionsMap } from "@/types";
import { defaultPlanillaPredictions } from "@/data/defaultPlanillaPredictions";
import { useUser } from "./UserContext";

const PLANILLA_KEY = "produsa_planilla_v1";
const BONUS_KEY = "produsa_bonus_v1";

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

function isDouble(outcome: PlanillaOutcome): boolean {
  return outcome.length === 2;
}

function loadFromStorage<T>(key: string, userId: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (stored.version !== 1 || stored.userId !== userId) return null;
    return stored.data;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, userId: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ version: 1, userId, data }));
  } catch {}
}

export function PlanillaProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [predictions, setPredictions] = useState<PlanillaPredictionsMap>({});
  const [bonusPredictions, setBonusPredictions] = useState<BonusPredictionsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage<PlanillaPredictionsMap>(PLANILLA_KEY, user.id);
    if (stored) {
      setPredictions(stored);
    } else {
      setPredictions(defaultPlanillaPredictions);
      saveToStorage(PLANILLA_KEY, user.id, defaultPlanillaPredictions);
    }
    setBonusPredictions(loadFromStorage<BonusPredictionsMap>(BONUS_KEY, user.id) ?? {});
    setIsLoaded(true);
  }, [user.id]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(PLANILLA_KEY, user.id, predictions);
  }, [predictions, isLoaded, user.id]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(BONUS_KEY, user.id, bonusPredictions);
  }, [bonusPredictions, isLoaded, user.id]);

  const setPrediction = useCallback(
    (matchId: string, outcome: PlanillaOutcome) => {
      setPredictions((prev) => ({
        ...prev,
        [matchId]: { matchId, outcome },
      }));
    },
    [],
  );

  const removePrediction = useCallback((matchId: string) => {
    setPredictions((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  }, []);

  const setBonusPrediction = useCallback(
    (questionId: string, value: string) => {
      setBonusPredictions((prev) => ({ ...prev, [questionId]: value }));
    },
    [],
  );

  const getDoubleMatchId = useCallback(
    (_matchday: number, matchIds: string[]): string | null => {
      for (const id of matchIds) {
        const pred = predictions[id];
        if (pred && isDouble(pred.outcome)) return id;
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
