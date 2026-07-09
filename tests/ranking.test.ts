import { describe, expect, it } from "vitest";
import { rankLawyers, type RankableLawyer } from "../lib/ranking";

const L = (
  id: string,
  ratingAvg: number | null,
  reviewCount: number,
  completedCount: number,
  yearsExperience: number,
  minPriceQepik: number | null
) => ({ id, ratingAvg, reviewCount, completedCount, yearsExperience, minPriceQepik });

type T = RankableLawyer & { id: string };

describe("rankLawyers", () => {
  it("rating sort: higher first, unrated last — never treated as zero", () => {
    const list: T[] = [L("new", null, 0, 0, 20, 1000), L("good", 4.8, 5, 10, 3, 5000)];
    expect(rankLawyers(list, "rating").map((x) => x.id)).toEqual(["good", "new"]);
  });

  it("rating ties break by review count", () => {
    const list: T[] = [L("few", 5, 1, 2, 5, null), L("many", 5, 9, 2, 5, null)];
    expect(rankLawyers(list, "rating").map((x) => x.id)).toEqual(["many", "few"]);
  });

  it("price sort: cheapest first, no-price last", () => {
    const list: T[] = [L("none", 5, 9, 9, 9, null), L("cheap", 4, 1, 1, 1, 1500), L("mid", 5, 5, 5, 5, 5000)];
    expect(rankLawyers(list, "price").map((x) => x.id)).toEqual(["cheap", "mid", "none"]);
  });
});
