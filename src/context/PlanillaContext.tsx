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

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface PlanillaContextValue {
  predictions: PlanillaPredictionsMap;
  bonusPredictions: BonusPredictionsMap;
  isLoaded: boolean;
  saveStatus: SaveStatus;
  setPrediction: (matchId: string, outcome: PlanillaOutcome) => Promise<boolean>;
  removePrediction: (matchId: string) => Promise<boolean>;
  setBonusPrediction: (questionId: string, value: string) => Promise<boolean>;
  removeBonusPrediction: (questionId: string) => Promise<boolean>;
  getDoubleMatchId: (matchday: number, matchIds: string[]) => string | null;
}

const PlanillaContext = createContext<PlanillaContextValue>({
  predictions: {},
  bonusPredictions: {},
  isLoaded: false,
  saveStatus: "idle",
  setPrediction: async () => false,
  removePrediction: async () => false,
  setBonusPrediction: async () => false,
  removeBonusPrediction: async () => false,
  getDoubleMatchId: () => null,
});

export function PlanillaProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<PlanillaPredictionsMap>({});
  const [bonusPredictions, setBonusPredictions] = useState<BonusPredictionsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = { current: null as ReturnType<typeof setTimeout> | null };

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1000);
  }, []);

  const showError = useCallback(() => {
    setSaveStatus("error");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

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
        // Offline
      }
      setIsLoaded(true);
    }
    loadAll();
  }, []);

  const setPrediction = useCallback(
    async (matchId: string, outcome: PlanillaOutcome): Promise<boolean> => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, outcome }),
        });
        if (!res.ok) { showError(); return false; }
        setPredictions((prev) => ({
          ...prev,
          [matchId]: { matchId, outcome },
        }));
        showSaved();
        return true;
      } catch {
        showError();
        return false;
      }
    },
    [showSaved, showError],
  );

  const removePrediction = useCallback(
    async (matchId: string): Promise<boolean> => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/predictions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        });
        if (!res.ok) { showError(); return false; }
        setPredictions((prev) => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        showSaved();
        return true;
      } catch {
        showError();
        return false;
      }
    },
    [showSaved, showError],
  );

  const setBonusPrediction = useCallback(
    async (questionId: string, value: string): Promise<boolean> => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/bonus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer: value }),
        });
        if (!res.ok) { showError(); return false; }
        setBonusPredictions((prev) => ({ ...prev, [questionId]: value }));
        showSaved();
        return true;
      } catch {
        showError();
        return false;
      }
    },
    [showSaved, showError],
  );

  const removeBonusPrediction = useCallback(
    async (questionId: string): Promise<boolean> => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/bonus", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        });
        if (!res.ok) { showError(); return false; }
        setBonusPredictions((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        showSaved();
        return true;
      } catch {
        showError();
        return false;
      }
    },
    [showSaved, showError],
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
        saveStatus,
        setPrediction,
        removePrediction,
        setBonusPrediction,
        removeBonusPrediction,
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
