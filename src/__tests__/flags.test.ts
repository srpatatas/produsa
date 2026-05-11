import { getFlagUrl } from "@/data/flags";

describe("getFlagUrl", () => {
  it("returns correct URL for standard country codes", () => {
    expect(getFlagUrl("ar")).toBe("https://flagcdn.com/w80/ar.png");
    expect(getFlagUrl("br")).toBe("https://flagcdn.com/w80/br.png");
  });

  it("lowercases the code", () => {
    expect(getFlagUrl("AR")).toBe("https://flagcdn.com/w80/ar.png");
  });

  it("supports custom width", () => {
    expect(getFlagUrl("ar", 40)).toBe("https://flagcdn.com/w40/ar.png");
  });

  it("handles subdivision codes for England and Scotland", () => {
    expect(getFlagUrl("gb-eng")).toBe("https://flagcdn.com/w80/gb-eng.png");
    expect(getFlagUrl("gb-sct")).toBe("https://flagcdn.com/w80/gb-sct.png");
  });
});
