/** International E.164 normalizer. Bare local numbers still default to
 *  Azerbaijan so existing muscle memory keeps working. */
export function normalizePhone(input: string): string | null {
  const raw = input.replace(/[\s\-()]/g, "");
  if (raw.startsWith("+")) {
    const digits = raw.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return null;
    return `+${digits}`;
  }
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("994")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^\d{9}$/.test(d)) return null;
  return `+994${d}`;
}
