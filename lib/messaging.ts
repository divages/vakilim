export const FOLLOW_UP_HOURS = 48;

type MsgBooking = {
  status: string;
  endAt: Date;
};

/** Conversation is visible to participants once a real booking exists. */
export function isConversationVisible(status: string): boolean {
  return status !== "PENDING_PAYMENT";
}

/**
 * Writable: from payment (REQUESTED/CONFIRMED) through the consultation,
 * then a 48h follow-up window after it ends. Declined/cancelled: read-only.
 */
export function canMessage(booking: MsgBooking, now: Date = new Date()): boolean {
  if (booking.status === "REQUESTED" || booking.status === "CONFIRMED") return true;
  if (booking.status === "COMPLETED") {
    const closesAt = booking.endAt.getTime() + FOLLOW_UP_HOURS * 3_600_000;
    return now.getTime() <= closesAt;
  }
  return false;
}
