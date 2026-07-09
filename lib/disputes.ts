export const DISPUTE_WINDOW_HOURS = 72;
export const LAWYER_RESPONSE_HOURS = 48;

export function canOpenDispute(
  status: string,
  endAt: Date,
  now: Date = new Date()
): boolean {
  if (status !== "COMPLETED") return false;
  return now.getTime() <= endAt.getTime() + DISPUTE_WINDOW_HOURS * 3_600_000;
}

export function canReview(status: string): boolean {
  return status === "COMPLETED";
}

export function lawyerResponseDeadline(disputeCreatedAt: Date): Date {
  return new Date(
    disputeCreatedAt.getTime() + LAWYER_RESPONSE_HOURS * 3_600_000
  );
}
