import az from "@/messages/az.json";
import ru from "@/messages/ru.json";
import en from "@/messages/en.json";

const MESSAGES: Record<string, unknown> = { az, ru, en };

export type NotifParams = Record<string, string | number>;

type NotifDict = {
  notifT?: Record<string, { title?: string; body?: string } | string>;
};

/** Simple `{param}` substitution — notifT strings are flat by design.
 *  If a notification ever needs plurals or select, switch this file
 *  back to an ICU formatter; until then, six lines beat a type war. */
function interpolate(template: string, params: NotifParams): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in params ? String(params[k]) : m
  );
}

/**
 * Renders a notification's title/body in the given locale from the
 * `notifT` dictionary namespace. Falls back to Azerbaijani, and as a
 * last resort to the raw type string. Never throws.
 */
export function renderNotification(
  type: string,
  params: NotifParams | null | undefined,
  locale: string
): { title: string; body: string; linkLabel: string } {
  const p = params ?? {};
  for (const loc of [locale, "az"]) {
    const dict = (MESSAGES[loc] as NotifDict | undefined)?.notifT;
    const entry = dict?.[type];
    if (!entry || typeof entry === "string" || !entry.title || !entry.body)
      continue;
    const linkLabel =
      typeof dict?.emailLink === "string" ? dict.emailLink : "Link";
    return {
      title: interpolate(entry.title, p),
      body: interpolate(entry.body, p),
      linkLabel,
    };
  }
  return { title: type, body: "", linkLabel: "Link" };
}
