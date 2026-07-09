/**
 * Client cancellation refund policy (spec §10.2):
 *   >= 12h before start: 100%
 *   >= 2h  before start:  50%
 *   otherwise:             0%
 */
export function cancellationRefund(
  priceQepik: number,
  startAt: Date,
  now: Date = new Date()
): { pct: 0 | 50 | 100; refundQepik: number } {
  const hours = (startAt.getTime() - now.getTime()) / 3_600_000;
  const pct = hours >= 12 ? 100 : hours >= 2 ? 50 : 0;
  return { pct, refundQepik: Math.round((priceQepik * pct) / 100) };
}
