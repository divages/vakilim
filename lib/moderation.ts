const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_CANDIDATE_RE = /\+?\d[\d\s\-().]{6,}\d/g;
const MESSENGER_RE = /\b(whatsapp|vatsap|telegram|viber)\b/i;

/** Detects attempts to move contact off-platform. Flags, never blocks. */
export function detectContactInfo(body: string): string[] {
  const reasons: string[] = [];

  const candidates = body.match(PHONE_CANDIDATE_RE) ?? [];
  if (candidates.some((c) => c.replace(/\D/g, "").length >= 9))
    reasons.push("PHONE");

  if (EMAIL_RE.test(body)) reasons.push("EMAIL");
  if (MESSENGER_RE.test(body)) reasons.push("MESSENGER");

  return reasons;
}
