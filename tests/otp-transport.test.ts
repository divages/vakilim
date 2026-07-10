import { describe, expect, it } from "vitest";
import { buildOtpPayload } from "@/lib/otp-transport";

describe("buildOtpPayload", () => {
  it("strips the leading + and carries the code in body and button", () => {
    const p = buildOtpPayload("+994501234567", "123456", "az");
    expect(p.to).toBe("994501234567");
    expect(p.template.components[0].parameters[0].text).toBe("123456");
    expect(p.template.components[1].parameters[0].text).toBe("123456");
  });

  it("maps locales to template language codes", () => {
    expect(buildOtpPayload("+994", "1", "ru").template.language.code).toBe("ru");
    expect(buildOtpPayload("+994", "1", "en").template.language.code).toBe("en");
  });

  it("falls back to Azerbaijani for unknown locales", () => {
    expect(buildOtpPayload("+994", "1", "xx").template.language.code).toBe("az");
  });
});
