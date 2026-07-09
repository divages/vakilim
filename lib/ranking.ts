export type RankableLawyer = {
  ratingAvg: number | null;
  reviewCount: number;
  completedCount: number;
  yearsExperience: number;
  minPriceQepik: number | null;
};

export type SortMode = "rating" | "experience" | "price";

function nullsLastDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function nullsLastAsc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

/** Ranking v1 — deliberately transparent, unit-tested tuple comparison. */
export function rankLawyers<T extends RankableLawyer>(
  lawyers: T[],
  sort: SortMode
): T[] {
  const byRating = (a: T, b: T) =>
    nullsLastDesc(a.ratingAvg, b.ratingAvg) ||
    b.reviewCount - a.reviewCount ||
    b.completedCount - a.completedCount ||
    b.yearsExperience - a.yearsExperience;

  const byExperience = (a: T, b: T) =>
    b.yearsExperience - a.yearsExperience ||
    nullsLastDesc(a.ratingAvg, b.ratingAvg) ||
    b.completedCount - a.completedCount;

  const byPrice = (a: T, b: T) =>
    nullsLastAsc(a.minPriceQepik, b.minPriceQepik) ||
    nullsLastDesc(a.ratingAvg, b.ratingAvg);

  const cmp =
    sort === "experience" ? byExperience : sort === "price" ? byPrice : byRating;
  return [...lawyers].sort(cmp);
}
