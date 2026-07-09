// Azerbaijan uses fixed UTC+4 year-round (DST abolished in 2016),
// which makes a constant offset safe. Revisit if serving other timezones.
const BAKU_UTC_OFFSET = "+04:00";
const MIN_NOTICE_MIN = 60;

// JS Date.getDay() convention: 0 = Sunday … 6 = Saturday
export const WEEKDAY_LABELS_AZ = [
  "Bazar",
  "Bazar ertəsi",
  "Çərşənbə axşamı",
  "Çərşənbə",
  "Cümə axşamı",
  "Cümə",
  "Şənbə",
];

// Monday-first ordering for display
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

const bakuDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Baku",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date (YYYY-MM-DD) in Baku for a given instant. */
export function bakuDateIso(date: Date): string {
  return bakuDateFmt.format(date);
}

/** Weekday (JS convention) of a YYYY-MM-DD calendar date. */
export function weekdayOfIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** UTC instant of Baku wall-clock `minutes after midnight` on a given date. */
export function bakuMinutesToUtc(dateIso: string, minutes: number): Date {
  const base = new Date(`${dateIso}T00:00:00${BAKU_UTC_OFFSET}`).getTime();
  return new Date(base + minutes * 60_000);
}

export type Rule = { weekday: number; startMin: number; endMin: number };
export type Busy = { startAt: Date; endAt: Date };

export type Slot = {
  dateIso: string;
  weekday: number;
  startMin: number;
  label: string;
  startAt: Date;
  endAt: Date;
};

export function generateSlots(opts: {
  rules: Rule[];
  bufferMin: number;
  durationMin: number;
  days: number;
  now?: Date;
  busy?: Busy[];
}): Slot[] {
  const { rules, bufferMin, durationMin, days } = opts;
  const now = opts.now ?? new Date();
  const busy = opts.busy ?? [];
  const notBefore = now.getTime() + MIN_NOTICE_MIN * 60_000;
  const step = durationMin + bufferMin;

  const slots: Slot[] = [];

  for (let d = 0; d < days; d++) {
    const dayInstant = new Date(now.getTime() + d * 24 * 60 * 60_000);
    const dateIso = bakuDateIso(dayInstant);
    const weekday = weekdayOfIso(dateIso);

    const dayRules = rules
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => a.startMin - b.startMin);

    for (const rule of dayRules) {
      for (let t = rule.startMin; t + durationMin <= rule.endMin; t += step) {
        const startAt = bakuMinutesToUtc(dateIso, t);
        const endAt = new Date(startAt.getTime() + durationMin * 60_000);

        if (startAt.getTime() < notBefore) continue;

        const clash = busy.some(
          (b) => startAt < b.endAt && endAt > b.startAt
        );
        if (clash) continue;

        slots.push({
          dateIso,
          weekday,
          startMin: t,
          label: fmtMin(t),
          startAt,
          endAt,
        });
      }
    }
  }

  return slots;
}
