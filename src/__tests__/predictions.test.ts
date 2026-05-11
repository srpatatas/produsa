import { loadPredictions, savePredictions } from "@/lib/predictions";
import { defaultUserPredictions } from "@/data/defaultPredictions";
import { PredictionsMap } from "@/types";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    },
    writable: true,
  });
});

describe("predictions localStorage", () => {
  it("seeds default predictions when nothing stored", () => {
    expect(loadPredictions("user1")).toEqual(defaultUserPredictions);
  });

  it("saves and loads predictions", () => {
    const predictions: PredictionsMap = {
      "A-1": { matchId: "A-1", homeScore: 2, awayScore: 1, timestamp: 123 },
    };
    savePredictions("user1", predictions);
    const loaded = loadPredictions("user1");
    expect(loaded["A-1"].homeScore).toBe(2);
    expect(loaded["A-1"].awayScore).toBe(1);
  });

  it("returns empty map for different user", () => {
    const predictions: PredictionsMap = {
      "A-1": { matchId: "A-1", homeScore: 2, awayScore: 1, timestamp: 123 },
    };
    savePredictions("user1", predictions);
    expect(loadPredictions("user2")).toEqual({});
  });

  it("handles corrupted data gracefully", () => {
    mockStorage["produsa_predictions_v1"] = "not json";
    expect(loadPredictions("user1")).toEqual({});
  });
});
