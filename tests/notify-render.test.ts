import { describe, expect, it } from "vitest";
import { renderNotification } from "@/lib/notify-render";

describe("renderNotification", () => {
  it("renders Azerbaijani with interpolated params", () => {
    const r = renderNotification("BOOKING_ACCEPTED", { when: "2026-07-15 14:00" }, "az");
    expect(r.title).toBe("Görüş təsdiqləndi");
    expect(r.body).toContain("2026-07-15 14:00");
  });

  it("renders Russian for a Russian-locale recipient", () => {
    const r = renderNotification("REMINDER_24H", { when: "2026-07-15 14:00" }, "ru");
    expect(r.title).toBe("Встреча завтра");
    expect(r.body).toContain("Напоминание");
    expect(r.linkLabel).toBe("Ссылка");
  });

  it("renders English including the email link label", () => {
    const r = renderNotification("NEW_MESSAGE", { sender: "Gunel" }, "en");
    expect(r.body).toBe("Gunel sent you a message.");
    expect(r.linkLabel).toBe("Link");
  });

  it("never throws on an unknown type — falls back to the raw type", () => {
    const r = renderNotification("SOME_FUTURE_TYPE", null, "ru");
    expect(r.title).toBe("SOME_FUTURE_TYPE");
  });
});
