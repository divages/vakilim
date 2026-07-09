import { describe, expect, it } from "vitest";
import { canReschedule } from "../lib/reschedule";

const start = new Date("2026-07-20T08:00:00.000Z");
const at = (iso: string) => new Date(iso);

describe("canReschedule", () => {
  it("allows exactly at the 24h boundary, refuses just inside it", () => {
    expect(canReschedule("CONFIRMED", start, 0, at("2026-07-19T08:00:00Z"))).toBe(true);
    expect(canReschedule("CONFIRMED", start, 0, at("2026-07-19T08:01:00Z"))).toBe(false);
  });

  it("allows one move only", () => {
    expect(canReschedule("CONFIRMED", start, 1, at("2026-07-15T08:00:00Z"))).toBe(false);
  });

  it("applies only to live bookings", () => {
    expect(canReschedule("REQUESTED", start, 0, at("2026-07-15T08:00:00Z"))).toBe(true);
    expect(canReschedule("CANCELLED", start, 0, at("2026-07-15T08:00:00Z"))).toBe(false);
    expect(canReschedule("COMPLETED", start, 0, at("2026-07-15T08:00:00Z"))).toBe(false);
  });
});
