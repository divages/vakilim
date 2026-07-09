import { describe, expect, it } from "vitest";
import { canMessage, isConversationVisible } from "../lib/messaging";

const end = new Date("2026-07-13T08:30:00.000Z");
const at = (iso: string) => new Date(iso);

describe("messaging window", () => {
  it("is writable while requested or confirmed", () => {
    expect(canMessage({ status: "REQUESTED", endAt: end }, at("2026-07-10T00:00:00Z"))).toBe(true);
    expect(canMessage({ status: "CONFIRMED", endAt: end }, at("2026-07-13T08:00:00Z"))).toBe(true);
  });

  it("stays writable for 48h after completion, then closes", () => {
    expect(canMessage({ status: "COMPLETED", endAt: end }, at("2026-07-15T08:30:00Z"))).toBe(true);
    expect(canMessage({ status: "COMPLETED", endAt: end }, at("2026-07-15T08:31:00Z"))).toBe(false);
  });

  it("is read-only for declined and cancelled bookings", () => {
    expect(canMessage({ status: "DECLINED", endAt: end }, at("2026-07-10T00:00:00Z"))).toBe(false);
    expect(canMessage({ status: "CANCELLED", endAt: end }, at("2026-07-10T00:00:00Z"))).toBe(false);
  });

  it("hides conversations for unpaid bookings", () => {
    expect(isConversationVisible("PENDING_PAYMENT")).toBe(false);
    expect(isConversationVisible("CONFIRMED")).toBe(true);
  });
});
