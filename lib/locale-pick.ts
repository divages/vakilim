/** One locale-pick to replace nine local copies. Generic over any row
 *  carrying `${field}Az/Ru/En`; AZ fallback; no caller-side casts. */
export function pickL<R extends Record<string, unknown>>(
  row: R,
  field: string,
  locale: string
): string {
  const az = row[`${field}Az`] as string;
  const v =
    locale === "ru"
      ? (row[`${field}Ru`] as string | null | undefined)
      : locale === "en"
        ? (row[`${field}En`] as string | null | undefined)
        : az;
  return v ?? az;
}

export function areaNameL(
  a: { nameAz: string; nameRu: string | null; nameEn: string | null },
  locale: string
): string {
  if (locale === "ru") return a.nameRu ?? a.nameAz;
  if (locale === "en") return a.nameEn ?? a.nameAz;
  return a.nameAz;
}
