import { describe, expect, it } from "vitest";
import { generateSlots, type Rule } from "../lib/slots";

// Monday two-block schedule from the manual checkpoint:
// 10:00–13:00 and 14:00–18:00 (minutes from Baku midnight)
const MONDAY_RULES: Rule[] = [
  { weekday: 1, startMin: 600, endMin: 780 },
  { weekday: 1, startMin: 840, endMin: 1080 },
];

// Sunday 2026-07-12 12:00 Baku time == 08:00 UTC.
// The following Monday (2026-07-13) falls inside the 7-day window.
const SUNDAY_NOON_BAKU = new Date("2026-07-12T08:00:00.000Z");

function mondayLabels(slots: ReturnType<typeof generateSlots>) {
  return slots.filter((s) => s.dateIso === "2026-07-13").map((s) => s.label);
}

describe("generateSlots", () => {
  it("steps by duration + buffer and respects block ends", () => {
    const slots = generateSlots({
      rules: MONDAY_RULES,
      bufferMin: 10,
      durationMin: 30,
      days: 7,
      now: SUNDAY_NOON_BAKU,
    });

    expect(mondayLabels(slots)).toEqual([
      "10:00",
      "10:40",
      "11:20",
      "12:00",
      "14:00",
      "14:40",
      "15:20",
      "16:00",
      "16:40",
      "17:20",
    ]);
  });

  it("excludes slots that clash with existing bookings", () => {
    const slots = generateSlots({
      rules: MONDAY_RULES,
      bufferMin: 10,
      durationMin: 30,
      days: 7,
      now: SUNDAY_NOON_BAKU,
      busy: [
        {
          // 10:40–11:10 Baku on Monday 2026-07-13 == 06:40–07:10 UTC
          startAt: new Date("2026-07-13T06:40:00.000Z"),
          endAt: new Date("2026-07-13T07:10:00.000Z"),
        },
      ],
    });

    const labels = mondayLabels(slots);
    expect(labels).not.toContain("10:40");
    expect(labels).toContain("10:00");
    expect(labels).toContain("11:20");
  });

  it("filters slots starting within the minimum notice window", () => {
    // Monday 09:30 Baku == 05:30 UTC: 10:00 is 30 min away (too soon),
    // 10:40 is 70 min away (allowed).
    const mondayMorning = new Date("2026-07-13T05:30:00.000Z");
    const slots = generateSlots({
      rules: MONDAY_RULES,
      bufferMin: 10,
      durationMin: 30,
      days: 1,
      now: mondayMorning,
    });

    const labels = mondayLabels(slots);
    expect(labels).not.toContain("10:00");
    expect(labels[0]).toBe("10:40");
  });

  it("produces nothing for weekdays without rules", () => {
    const slots = generateSlots({
      rules: MONDAY_RULES,
      bufferMin: 0,
      durationMin: 30,
      days: 1,
      now: SUNDAY_NOON_BAKU, // Sunday only — no Monday inside 1 day
    });
    expect(slots).toEqual([]);
  });
});
