import { PredictionsMap } from "@/types";
import { defaultUserPredictions } from "@/data/defaultPredictions";

const STORAGE_KEY = "produsa_predictions_v1";

interface StoredPredictions {
  version: 1;
  userId: string;
  predictions: PredictionsMap;
  lastUpdated: number;
}

export function loadPredictions(userId: string | number): PredictionsMap {
  const uid = String(userId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savePredictions(uid, defaultUserPredictions);
      return defaultUserPredictions;
    }
    const stored: StoredPredictions = JSON.parse(raw);
    if (stored.version !== 1 || stored.userId !== uid) return {};
    return stored.predictions;
  } catch {
    return {};
  }
}

export function savePredictions(
  userId: string | number,
  predictions: PredictionsMap,
): void {
  try {
    const data: StoredPredictions = {
      version: 1,
      userId: String(userId),
      predictions,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}
