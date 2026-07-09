export const RESCHEDULE_MIN_HOURS = 24;
export const MAX_RESCHEDULES = 1;

/** Spec §10.2: client may move a booking once, up to 24h before start. */
export function canReschedule(
  status: string,
  startAt: Date,
  rescheduledCount: number,
  now: Date = new Date()
): boolean {
  if (status !== "REQUESTED" && status !== "CONFIRMED") return false;
  if (rescheduledCount >= MAX_RESCHEDULES) return false;
  const hours = (startAt.getTime() - now.getTime()) / 3_600_000;
  return hours >= RESCHEDULE_MIN_HOURS;
}
