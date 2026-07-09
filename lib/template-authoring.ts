export const BUILTIN_PLACEHOLDERS = ["TODAY", "DOC_UID"];

export function extractPlaceholders(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)) found.add(m[1]);
  return [...found];
}

/**
 * A template is authorable only if every placeholder in the body is either
 * a declared field key or a builtin. Unused fields are flagged, not fatal.
 */
export function validateTemplateContent(
  body: string,
  fieldKeys: string[]
): { ok: boolean; unknown: string[]; unused: string[] } {
  const placeholders = extractPlaceholders(body);
  const known = new Set([...fieldKeys, ...BUILTIN_PLACEHOLDERS]);
  const unknown = placeholders.filter((p) => !known.has(p));
  const used = new Set(placeholders);
  const unused = fieldKeys.filter((k) => !used.has(k));
  return { ok: unknown.length === 0, unknown, unused };
}
