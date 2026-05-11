import { fetchLiveScores } from "@/lib/liveScoreApi";

const mockApiResponse = {
  response: [
    {
      fixture: {
        id: 1525713,
        status: { short: "1H", elapsed: 34 },
      },
      teams: {
        home: { name: "Junior W" },
        away: { name: "Santa Fe W" },
      },
      goals: { home: 2, away: 1 },
    },
    {
      fixture: {
        id: 9999999,
        status: { short: "2H", elapsed: 67 },
      },
      teams: {
        home: { name: "Random FC" },
        away: { name: "Other FC" },
      },
      goals: { home: 0, away: 0 },
    },
  ],
};

function mockFetch(response: object, ok = true): typeof fetch {
  return jest.fn().mockResolvedValue({
    ok,
    json: async () => response,
  }) as unknown as typeof fetch;
}

describe("fetchLiveScores", () => {
  it("returns mapped score for known fixture", async () => {
    const scores = await fetchLiveScores("test-key", mockFetch(mockApiResponse));

    expect(scores["B-1"]).toEqual({
      homeScore: 2,
      awayScore: 1,
      minute: 34,
      status: "1H",
    });
  });

  it("ignores fixtures not in our mapping", async () => {
    const scores = await fetchLiveScores("test-key", mockFetch(mockApiResponse));

    expect(Object.keys(scores)).toEqual(["B-1"]);
  });

  it("returns empty scores when API fails", async () => {
    const scores = await fetchLiveScores("test-key", mockFetch({}, false));

    expect(scores).toEqual({});
  });

  it("handles null goals gracefully", async () => {
    const response = {
      response: [
        {
          fixture: {
            id: 1525713,
            status: { short: "NS", elapsed: null },
          },
          goals: { home: null, away: null },
        },
      ],
    };

    const scores = await fetchLiveScores("test-key", mockFetch(response));

    expect(scores["B-1"]).toEqual({
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      status: "NS",
    });
  });

  it("handles empty response", async () => {
    const scores = await fetchLiveScores(
      "test-key",
      mockFetch({ response: [] }),
    );

    expect(scores).toEqual({});
  });

  it("passes correct headers to fetch", async () => {
    const fakeFetch = mockFetch({ response: [] });
    await fetchLiveScores("my-secret-key", fakeFetch);

    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining("fixtures?live=all"),
      expect.objectContaining({
        headers: { "x-apisports-key": "my-secret-key" },
      }),
    );
  });
});
