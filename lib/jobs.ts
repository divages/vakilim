import { prisma } from "@/lib/prisma";
import { notifyUser, whenLabel } from "@/lib/notify";

export const UNPAID_EXPIRE_MIN = 30;
export const REQUEST_EXPIRE_HOURS = 12;
export const REMIND_FAR_HOURS = 24;
export const REMIND_NEAR_HOURS = 1;
export const DISPUTE_RESPONSE_HOURS = 48;

const MS = { min: 60_000, hour: 3_600_000 };

export function isUnpaidExpired(createdAt: Date, now: Date): boolean {
  return now.getTime() - createdAt.getTime() >= UNPAID_EXPIRE_MIN * MS.min;
}

export function isRequestExpired(createdAt: Date, now: Date): boolean {
  return now.getTime() - createdAt.getTime() >= REQUEST_EXPIRE_HOURS * MS.hour;
}

/** Catch-up semantics: due when inside the window, even if the tick was late. */
export function dueForReminder(
  startAt: Date,
  alreadySentAt: Date | null,
  hoursAhead: number,
  now: Date
): boolean {
  if (alreadySentAt) return false;
  const t = startAt.getTime();
  return t > now.getTime() && t <= now.getTime() + hoursAhead * MS.hour;
}

export type TickCounts = {
  completed: number;
  unpaidExpired: number;
  requestsExpired: number;
  reminded24: number;
  reminded1: number;
  disputeNudges: number;
};

export async function runTick(now = new Date()): Promise<TickCounts> {
  const counts: TickCounts = {
    completed: 0,
    unpaidExpired: 0,
    requestsExpired: 0,
    reminded24: 0,
    reminded1: 0,
    disputeNudges: 0,
  };

  // 1) Finished consultations become COMPLETED.
  counts.completed = (
    await prisma.booking.updateMany({
      where: { status: "CONFIRMED", endAt: { lt: now } },
      data: { status: "COMPLETED" },
    })
  ).count;

  // 2) Abandoned checkouts release their slot.
  counts.unpaidExpired = (
    await prisma.booking.updateMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lt: new Date(now.getTime() - UNPAID_EXPIRE_MIN * MS.min) },
      },
      data: { status: "CANCELLED", activeSlotKey: null },
    })
  ).count;

  // 3) Unanswered requests auto-decline with full refund.
  const expiredRequests = await prisma.booking.findMany({
    where: {
      status: "REQUESTED",
      createdAt: {
        lt: new Date(now.getTime() - REQUEST_EXPIRE_HOURS * MS.hour),
      },
    },
    include: { payment: true, lawyer: { select: { userId: true } } },
    take: 50,
  });
  for (const b of expiredRequests) {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: b.id },
        data: { status: "DECLINED", activeSlotKey: null },
      }),
      ...(b.payment
        ? [
            prisma.payment.update({
              where: { id: b.payment.id },
              data: {
                status: "REFUNDED",
                refundedQepik: b.payment.amountQepik,
              },
            }),
          ]
        : []),
    ]);
    await notifyUser(b.clientId, {
      type: "REQUEST_EXPIRED_CLIENT",
      params: { hours: REQUEST_EXPIRE_HOURS },
      link: "/bookings",
    });
    await notifyUser(b.lawyer.userId, {
      type: "REQUEST_EXPIRED_LAWYER",
      params: { when: whenLabel(b.startAt) },
      link: "/lawyer/bookings",
    });
    counts.requestsExpired++;
  }

  // 4) 24h reminders.
  const far = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminded24At: null,
      startAt: {
        gt: now,
        lte: new Date(now.getTime() + REMIND_FAR_HOURS * MS.hour),
      },
    },
    include: { lawyer: { select: { userId: true } } },
    take: 50,
  });
  for (const b of far) {
    await notifyUser(b.clientId, {
      type: "REMINDER_24H",
      params: { when: whenLabel(b.startAt) },
      link: "/bookings",
    });
    await notifyUser(b.lawyer.userId, {
      type: "REMINDER_24H",
      params: { when: whenLabel(b.startAt) },
      link: "/lawyer/bookings",
    });
    await prisma.booking.update({
      where: { id: b.id },
      data: { reminded24At: now },
    });
    counts.reminded24++;
  }

  // 5) 1h reminders, with the call link.
  const near = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminded1At: null,
      startAt: {
        gt: now,
        lte: new Date(now.getTime() + REMIND_NEAR_HOURS * MS.hour),
      },
    },
    include: { lawyer: { select: { userId: true } } },
    take: 50,
  });
  for (const b of near) {
    await notifyUser(b.clientId, {
      type: "REMINDER_1H",
      params: { when: whenLabel(b.startAt) },
      link: `/call/${b.id}`,
    });
    await notifyUser(b.lawyer.userId, {
      type: "REMINDER_1H",
      params: { when: whenLabel(b.startAt) },
      link: `/call/${b.id}`,
    });
    await prisma.booking.update({
      where: { id: b.id },
      data: { reminded1At: now },
    });
    counts.reminded1++;
  }

  // 6) Overdue dispute responses: nudge lawyer + alert admins, once.
  const overdue = await prisma.dispute.findMany({
    where: {
      status: "OPEN",
      overdueNotifiedAt: null,
      createdAt: {
        lt: new Date(now.getTime() - DISPUTE_RESPONSE_HOURS * MS.hour),
      },
    },
    include: { booking: { include: { lawyer: { select: { userId: true } } } } },
    take: 20,
  });
  const admins = overdue.length
    ? await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      })
    : [];
  for (const d of overdue) {
    await notifyUser(d.booking.lawyer.userId, {
      type: "DISPUTE_OVERDUE_LAWYER",
      params: { hours: DISPUTE_RESPONSE_HOURS },
      link: "/lawyer/disputes",
    });
    for (const a of admins) {
      await notifyUser(a.id, {
        type: "DISPUTE_OVERDUE_ADMIN",
        params: { hours: DISPUTE_RESPONSE_HOURS },
        link: "/admin/disputes",
      });
    }
    await prisma.dispute.update({
      where: { id: d.id },
      data: { overdueNotifiedAt: now },
    });
    counts.disputeNudges++;
  }

  return counts;
}
