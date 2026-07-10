import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";

describe("buildIcs", () => {
  it("emits UTC stamps and CRLF lines", () => {
    const ics = buildIcs({
      uid: "b1@vakilim.az",
      start: new Date("2026-07-15T10:00:00.000Z"),
      end: new Date("2026-07-15T10:30:00.000Z"),
      summary: "Test",
      description: "Desc",
      url: "https://vakilim.az/call/b1",
    });
    expect(ics).toContain("DTSTART:20260715T100000Z");
    expect(ics).toContain("DTEND:20260715T103000Z");
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });

  it("escapes commas and semicolons in text fields", () => {
    const ics = buildIcs({
      uid: "b2@vakilim.az",
      start: new Date(0),
      end: new Date(1000),
      summary: "Əliyev, Rüstəm; vəkil",
      description: "line1\nline2",
      url: "https://vakilim.az",
    });
    expect(ics).toContain("SUMMARY:Əliyev\\, Rüstəm\\; vəkil");
    expect(ics).toContain("DESCRIPTION:line1\\nline2");
  });
});
