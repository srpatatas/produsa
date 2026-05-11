import { getFlagEmoji } from "@/data/flags";

describe("getFlagEmoji", () => {
  it("returns correct emoji for standard country codes", () => {
    expect(getFlagEmoji("ar")).toBe("🇦🇷");
    expect(getFlagEmoji("br")).toBe("🇧🇷");
    expect(getFlagEmoji("us")).toBe("🇺🇸");
  });

  it("handles uppercase codes", () => {
    expect(getFlagEmoji("AR")).toBe("🇦🇷");
  });

  it("returns England subdivision flag", () => {
    const flag = getFlagEmoji("gb-eng");
    expect(flag).toBeTruthy();
    expect(flag).not.toBe("🇬🇧");
  });

  it("returns Scotland subdivision flag", () => {
    const flag = getFlagEmoji("gb-sct");
    expect(flag).toBeTruthy();
    expect(flag).not.toBe("🇬🇧");
  });
});
