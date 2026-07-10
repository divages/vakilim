/** BCP-47 tags for date/number formatting per app locale. */
export function intlTag(locale: string): string {
  return locale === "ru" ? "ru-RU" : locale === "en" ? "en-GB" : "az-AZ";
}
