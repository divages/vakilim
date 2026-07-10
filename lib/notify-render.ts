import { createTranslator } from "next-intl";
import az from "@/messages/az.json";
import ru from "@/messages/ru.json";
import en from "@/messages/en.json";

const MESSAGES: Record<string, unknown> = { az, ru, en };

export type NotifParams = Record<string, string | number>;

type NotifDict = { notifT?: Record<string, { title?: string; body?: string } | string> };

/**
 * Renders a notification's title/body in the given locale from the
 * `notifT` dictionary namespace. next-intl does not throw on missing
 * messages — it logs and returns the key path — so absence is checked
 * explicitly against the dictionary before translating. Falls back to
 * Azerbaijani, and as a last resort to the raw type string.
 */
export function renderNotification(
  type: string,
  params: NotifParams | null | undefined,
  locale: string
): { title: string; body: string; linkLabel: string } {
  const p = params ?? {};
  for (const loc of [locale, "az"]) {
    const dict = MESSAGES[loc] as NotifDict | undefined;
    const entry = dict?.notifT?.[type];
    if (!entry || typeof entry === "string" || !entry.title || !entry.body) continue;
    const t = createTranslator({
      locale: loc,
      messages: MESSAGES[loc] as never,
      namespace: "notifT",
      onError: () => {},
      getMessageFallback: ({ key }) => key,
    });
    return {
      title: t(`${type}.title` as never, p as never),
      body: t(`${type}.body` as never, p as never),
      linkLabel: t("emailLink" as never),
    };
  }
  return { title: type, body: "", linkLabel: "Link" };
}
