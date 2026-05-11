import { PredictionsMap } from "@/types";

const STORAGE_KEY = "produsa_predictions_v1";

interface StoredPredictions {
  version: 1;
  userId: string;
  predictions: PredictionsMap;
  lastUpdated: number;
}

export function loadPredictions(userId: string): PredictionsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored: StoredPredictions = JSON.parse(raw);
    if (stored.version !== 1 || stored.userId !== userId) return {};
    return stored.predictions;
  } catch {
    return {};
  }
}

export function savePredictions(
  userId: string,
  predictions: PredictionsMap,
): void {
  try {
    const data: StoredPredictions = {
      version: 1,
      userId,
      predictions,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}
