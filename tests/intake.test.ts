import { describe, expect, it } from "vitest";
import { buildIntakePrompt, parseIntake } from "@/lib/intake";

const areas = [
  { slug: "aile-huququ", name: "Ailə hüququ" },
  { slug: "emek-huququ", name: "Əmək hüququ" },
];
const slugs = new Set(areas.map((a) => a.slug));

describe("buildIntakePrompt", () => {
  it("embeds the allowed slugs and the visitor locale", () => {
    const p = buildIntakePrompt("işdən çıxarıldım", "ru", areas);
    expect(p).toContain("aile-huququ");
    expect(p).toContain('language code "ru"');
    expect(p).toContain("işdən çıxarıldım");
  });
});

describe("parseIntake", () => {
  it("strips code fences and accepts a valid slug", () => {
    const r = parseIntake(
      '```json\n{"areaSlug":"emek-huququ","summary":"S.","question":"Q?"}\n```',
      slugs
    );
    expect(r?.areaSlug).toBe("emek-huququ");
    expect(r?.summary).toBe("S.");
  });

  it("falls back to other for unknown slugs and rejects empty fields", () => {
    expect(
      parseIntake('{"areaSlug":"made-up","summary":"S","question":"Q"}', slugs)
        ?.areaSlug
    ).toBe("other");
    expect(parseIntake('{"areaSlug":"emek-huququ","summary":""}', slugs)).toBe(null);
  });
});
