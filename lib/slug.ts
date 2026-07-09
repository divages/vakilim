const AZ_MAP: Record<string, string> = {
  ə: "e", Ə: "e",
  ğ: "g", Ğ: "g",
  ı: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  ç: "c", Ç: "c",
};

export function slugify(input: string): string {
  const transliterated = input
    .split("")
    .map((ch) => AZ_MAP[ch] ?? ch)
    .join("");

  const base = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  return base || "vekil";
}

export function randomSuffix(length = 4): string {
  return Math.random().toString(36).slice(2, 2 + length);
}
