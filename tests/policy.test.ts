import { describe, expect, it } from "vitest";
import { cancellationRefund } from "../lib/policy";

const NOW = new Date("2026-07-13T08:00:00.000Z");
const hoursAhead = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe("cancellationRefund", () => {
  it("refunds 100% at 12h or more before start", () => {
    expect(cancellationRefund(5000, hoursAhead(12), NOW)).toEqual({
      pct: 100,
      refundQepik: 5000,
    });
    expect(cancellationRefund(5000, hoursAhead(72), NOW).pct).toBe(100);
  });

  it("refunds 50% between 2h and 12h before start", () => {
    expect(cancellationRefund(5000, hoursAhead(11.99), NOW).pct).toBe(50);
    expect(cancellationRefund(5000, hoursAhead(2), NOW)).toEqual({
      pct: 50,
      refundQepik: 2500,
    });
  });

  it("refunds nothing under 2h before start", () => {
    expect(cancellationRefund(5000, hoursAhead(1.99), NOW).pct).toBe(0);
    expect(cancellationRefund(5000, hoursAhead(0), NOW).refundQepik).toBe(0);
  });

  it("rounds odd amounts to whole qepik", () => {
    expect(cancellationRefund(3333, hoursAhead(5), NOW).refundQepik).toBe(1667);
  });
});
