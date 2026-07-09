import { describe, expect, it } from "vitest";
import { detectContactInfo } from "../lib/moderation";

describe("detectContactInfo", () => {
  it("catches phone numbers even with spaces and separators", () => {
    expect(detectContactInfo("Zəng edin: +994 50 123 45 67")).toContain("PHONE");
    expect(detectContactInfo("nömrəm 050-123-45-67")).toContain("PHONE");
  });

  it("catches emails and messenger keywords", () => {
    expect(detectContactInfo("yazın test@mail.ru")).toContain("EMAIL");
    expect(detectContactInfo("Telegram-da yazın")).toContain("MESSENGER");
  });

  it("leaves normal legal conversation unflagged", () => {
    expect(detectContactInfo("Sabah saat 15:00-da sənədləri gətirin, 3 nüsxə")).toEqual([]);
    expect(detectContactInfo("Xidmət haqqı 1500 AZN olacaq")).toEqual([]);
  });
});
