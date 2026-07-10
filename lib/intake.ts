/** Prompt + parser for the AI intake assistant. Pure and testable. */

export type AreaOption = { slug: string; name: string };

export function buildIntakePrompt(
  text: string,
  locale: string,
  areas: AreaOption[]
): string {
  const list = areas.map((a) => `- ${a.slug}: ${a.name}`).join("\n");
  return [
    "You are the intake assistant for Vakilim.az, a lawyer marketplace in Azerbaijan.",
    "A visitor describes a legal problem. Respond with STRICT JSON only — no prose, no code fences.",
    'Shape: {"areaSlug": string, "summary": string, "question": string}',
    `Rules:`,
    `1. areaSlug MUST be exactly one slug from this list, or "other" if none fits:`,
    list,
    `2. "summary": 2-3 sentences in language code "${locale}" — orient the visitor (what kind of matter this is, what a lawyer would typically clarify first). NEVER give legal advice, predictions, or instructions.`,
    `3. "question": a polite 2-4 sentence first message the visitor could send to a lawyer, in language "${locale}", first person, summarising their situation and asking for a consultation.`,
    "4. Do not invent facts beyond the visitor's text. Do not name laws or articles.",
    "",
    "Visitor's text:",
    text,
  ].join("\n");
}

export function parseIntake(
  raw: string,
  validSlugs: Set<string>
): { areaSlug: string; summary: string; question: string } | null {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
    const question = typeof obj.question === "string" ? obj.question.trim() : "";
    if (!summary || !question) return null;
    let areaSlug = typeof obj.areaSlug === "string" ? obj.areaSlug.trim() : "other";
    if (!validSlugs.has(areaSlug)) areaSlug = "other";
    return { areaSlug, summary, question };
  } catch {
    return null;
  }
}
