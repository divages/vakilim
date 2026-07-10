/** Minimal iCalendar builder — one VEVENT, RFC 5545 shaped. */
function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildIcs(ev: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  url: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vakilim.az//Booking//AZ",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(ev.start)}`,
    `DTEND:${stamp(ev.end)}`,
    `SUMMARY:${esc(ev.summary)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    `LOCATION:${esc(ev.url)}`,
    `URL:${ev.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
