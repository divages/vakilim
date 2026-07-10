import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/phone-intl";

describe("normalizePhone", () => {
  it("keeps full E.164 for any country", () => {
    expect(normalizePhone("+7 916 123-45-67")).toBe("+79161234567");
    expect(normalizePhone("+90 (532) 111 22 33")).toBe("+905321112233");
  });

  it("defaults bare local numbers to Azerbaijan", () => {
    expect(normalizePhone("050 123 45 67")).toBe("+994501234567");
    expect(normalizePhone("994 55 111 22 33")).toBe("+994551112233");
  });

  it("rejects garbage and out-of-range lengths", () => {
    expect(normalizePhone("+12")).toBe(null);
    expect(normalizePhone("abc")).toBe(null);
  });
});
