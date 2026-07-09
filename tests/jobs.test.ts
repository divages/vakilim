import { describe, expect, it } from "vitest";
import {
  dueForReminder,
  isRequestExpired,
  isUnpaidExpired,
} from "../lib/jobs";

const at = (iso: string) => new Date(iso);

describe("job windows", () => {
  it("expires unpaid bookings at 30 minutes", () => {
    expect(isUnpaidExpired(at("2026-07-20T08:00:00Z"), at("2026-07-20T08:30:00Z"))).toBe(true);
    expect(isUnpaidExpired(at("2026-07-20T08:00:00Z"), at("2026-07-20T08:29:00Z"))).toBe(false);
  });

  it("expires unanswered requests at 12 hours", () => {
    expect(isRequestExpired(at("2026-07-20T08:00:00Z"), at("2026-07-20T20:00:00Z"))).toBe(true);
    expect(isRequestExpired(at("2026-07-20T08:00:00Z"), at("2026-07-20T19:59:00Z"))).toBe(false);
  });

  it("reminders fire inside the window and never twice", () => {
    const start = at("2026-07-21T10:00:00Z");
    expect(dueForReminder(start, null, 24, at("2026-07-20T11:00:00Z"))).toBe(true);
    expect(dueForReminder(start, null, 24, at("2026-07-20T09:59:00Z"))).toBe(false);
    expect(dueForReminder(start, at("2026-07-20T11:00:00Z"), 24, at("2026-07-20T12:00:00Z"))).toBe(false);
  });

  it("reminders never fire for past bookings (catch-up stays sane)", () => {
    const start = at("2026-07-21T10:00:00Z");
    expect(dueForReminder(start, null, 24, at("2026-07-21T10:01:00Z"))).toBe(false);
  });
});
