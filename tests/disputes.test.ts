import { describe, expect, it } from "vitest";
import { canOpenDispute, canReview, lawyerResponseDeadline } from "../lib/disputes";

const end = new Date("2026-07-13T08:30:00.000Z");
const at = (iso: string) => new Date(iso);

describe("dispute window", () => {
  it("stays open for 72h after the consultation ends, then closes", () => {
    expect(canOpenDispute("COMPLETED", end, at("2026-07-16T08:30:00Z"))).toBe(true);
    expect(canOpenDispute("COMPLETED", end, at("2026-07-16T08:31:00Z"))).toBe(false);
  });

  it("never opens for non-completed bookings", () => {
    expect(canOpenDispute("CANCELLED", end, at("2026-07-13T09:00:00Z"))).toBe(false);
    expect(canOpenDispute("CONFIRMED", end, at("2026-07-13T08:00:00Z"))).toBe(false);
  });

  it("computes the lawyer response deadline at +48h", () => {
    expect(
      lawyerResponseDeadline(at("2026-07-14T10:00:00Z")).toISOString()
    ).toBe("2026-07-16T10:00:00.000Z");
  });
});

describe("review eligibility", () => {
  it("only completed bookings are reviewable", () => {
    expect(canReview("COMPLETED")).toBe(true);
    expect(canReview("CANCELLED")).toBe(false);
    expect(canReview("DECLINED")).toBe(false);
  });
});
