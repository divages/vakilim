import { prisma } from "@/lib/prisma";

/**
 * Lazy state transition: any CONFIRMED booking whose end time has passed
 * becomes COMPLETED. Idempotent; called on booking-list page loads until
 * a real background job replaces it.
 */
export async function completePastBookings(scope: {
  clientId?: string;
  lawyerId?: string;
}) {
  await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
      endAt: { lt: new Date() },
      ...scope,
    },
    data: { status: "COMPLETED" },
  });
}
