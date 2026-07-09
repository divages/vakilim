import { describe, expect, it } from "vitest";
import { validateAnswers, type FieldDef } from "../lib/doc-fields";

const fields: FieldDef[] = [
  { key: "name", labelAz: "Ad", type: "text", required: true },
  { key: "rent", labelAz: "Kirayə", type: "number", required: true },
  { key: "start", labelAz: "Başlanğıc", type: "date", required: true },
  { key: "note", labelAz: "Qeyd", type: "textarea", required: false },
];

describe("validateAnswers", () => {
  it("rejects missing required fields by key", () => {
    const r = validateAnswers(fields, { rent: "500", start: "2026-08-01" });
    expect(r).toEqual({ ok: false, fieldKey: "name" });
  });

  it("normalizes decimal commas in numbers", () => {
    const r = validateAnswers(fields, { name: "A B", rent: "450,5", start: "2026-08-01" });
    expect(r.ok && r.cleaned.rent).toBe("450.5");
  });

  it("rejects malformed dates and numbers", () => {
    expect(validateAnswers(fields, { name: "A", rent: "abc", start: "2026-08-01" })).toEqual({ ok: false, fieldKey: "rent" });
    expect(validateAnswers(fields, { name: "A", rent: "1", start: "01.08.2026" })).toEqual({ ok: false, fieldKey: "start" });
  });

  it("passes optional fields as empty strings", () => {
    const r = validateAnswers(fields, { name: "A", rent: "1", start: "2026-08-01" });
    expect(r.ok && r.cleaned.note).toBe("");
  });
});
