import { describe, expect, it } from "vitest";
import { validateTemplateContent } from "../lib/template-authoring";

describe("validateTemplateContent", () => {
  it("rejects placeholders that have no matching field", () => {
    const r = validateTemplateContent("Salam {{name}}, {{typo}}!", ["name"]);
    expect(r.ok).toBe(false);
    expect(r.unknown).toEqual(["typo"]);
  });

  it("accepts builtin placeholders without declared fields", () => {
    const r = validateTemplateContent("Tarix: {{TODAY}} · № {{DOC_UID}}", []);
    expect(r.ok).toBe(true);
  });

  it("flags declared fields the body never uses", () => {
    const r = validateTemplateContent("Yalnız {{a}}", ["a", "b"]);
    expect(r.ok).toBe(true);
    expect(r.unused).toEqual(["b"]);
  });
});
