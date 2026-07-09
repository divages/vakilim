export function normalizeAzPhone(raw: string): string | null {
  let n = raw.replace(/[^\d+]/g, "");
  if (n.startsWith("+994")) n = n.slice(4);
  else if (n.startsWith("994")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  if (!/^\d{9}$/.test(n)) return null;
  return `+994${n}`;
}