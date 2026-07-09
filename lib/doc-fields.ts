export type FieldDef = {
  key: string;
  labelAz: string;
  helpAz?: string;
  type: "text" | "textarea" | "date" | "number" | "select";
  required: boolean;
  options?: { value: string; labelAz: string }[];
  placeholder?: string;
};

export type Answers = Record<string, string>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUMBER_RE = /^\d+([.,]\d+)?$/;

export function validateAnswers(
  fields: FieldDef[],
  raw: Record<string, unknown>
): { ok: true; cleaned: Answers } | { ok: false; fieldKey: string } {
  const cleaned: Answers = {};
  for (const f of fields) {
    const v = typeof raw[f.key] === "string" ? (raw[f.key] as string).trim() : "";
    if (!v) {
      if (f.required) return { ok: false, fieldKey: f.key };
      cleaned[f.key] = "";
      continue;
    }
    if (f.type === "date" && !DATE_RE.test(v)) return { ok: false, fieldKey: f.key };
    if (f.type === "number") {
      if (!NUMBER_RE.test(v)) return { ok: false, fieldKey: f.key };
      cleaned[f.key] = v.replace(",", ".");
      continue;
    }
    if (f.type === "select" && !f.options?.some((o) => o.value === v))
      return { ok: false, fieldKey: f.key };
    const max = f.type === "textarea" ? 3000 : 500;
    cleaned[f.key] = v.slice(0, max);
  }
  return { ok: true, cleaned };
}

export function displayValue(f: FieldDef, v: string): string {
  if (!v) return "—";
  if (f.type === "date") {
    const [y, m, d] = v.split("-");
    return `${d}.${m}.${y}`;
  }
  if (f.type === "select")
    return f.options?.find((o) => o.value === v)?.labelAz ?? v;
  return v;
}
