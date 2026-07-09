import { describe, expect, it } from "vitest";
import { isJoinable, minutesUntilJoinable } from "../lib/call-window";

const start = new Date("2026-07-13T08:00:00.000Z");
const end = new Date("2026-07-13T08:30:00.000Z");
const at = (iso: string) => new Date(iso);

describe("call window", () => {
  it("opens 5 minutes before start and closes 10 minutes after end", () => {
    expect(isJoinable(start, end, at("2026-07-13T07:54:59.000Z"))).toBe(false);
    expect(isJoinable(start, end, at("2026-07-13T07:55:00.000Z"))).toBe(true);
    expect(isJoinable(start, end, at("2026-07-13T08:40:00.000Z"))).toBe(true);
    expect(isJoinable(start, end, at("2026-07-13T08:40:01.000Z"))).toBe(false);
  });

  it("counts minutes until the door opens", () => {
    expect(minutesUntilJoinable(start, at("2026-07-13T07:00:00.000Z"))).toBe(55);
    expect(minutesUntilJoinable(start, at("2026-07-13T07:56:00.000Z"))).toBe(0);
  });
});
