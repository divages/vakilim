export const JOIN_EARLY_MIN = 5;
export const GRACE_AFTER_END_MIN = 10;

export function isJoinable(startAt: Date, endAt: Date, now: Date = new Date()): boolean {
  const opens = startAt.getTime() - JOIN_EARLY_MIN * 60_000;
  const closes = endAt.getTime() + GRACE_AFTER_END_MIN * 60_000;
  return now.getTime() >= opens && now.getTime() <= closes;
}

export function minutesUntilJoinable(startAt: Date, now: Date = new Date()): number {
  const opens = startAt.getTime() - JOIN_EARLY_MIN * 60_000;
  return Math.max(0, Math.ceil((opens - now.getTime()) / 60_000));
}
