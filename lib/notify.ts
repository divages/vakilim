import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import { formatAzn } from "@/lib/money";
import { renderNotification, type NotifParams } from "@/lib/notify-render";

export function whenLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return `${bakuDateIso(d)} ${fmtMin(Math.round((d.getTime() - dayStart) / 60_000))}`;
}

export type NotifType =
  | "BOOKING_ACCEPTED"
  | "BOOKING_DECLINED"
  | "NEW_BOOKING_REQUEST"
  | "NEW_BOOKING"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED_REFUND"
  | "DISPUTE_RESOLVED_DISMISSED"
  | "NEW_REVIEW"
  | "NEW_MESSAGE"
  | "REQUEST_EXPIRED_CLIENT"
  | "REQUEST_EXPIRED_LAWYER"
  | "REMINDER_24H"
  | "REMINDER_1H"
  | "DISPUTE_OVERDUE_LAWYER"
  | "DISPUTE_OVERDUE_ADMIN";

type NotifyArgs = { type: NotifType; params?: NotifParams; link?: string };

/**
 * Stores the notification as type + params; the UI renders it in the
 * viewer's locale at display time, and the email below is rendered in
 * the recipient's saved locale at send time. Never throws.
 */
export async function notifyUser(userId: string, n: NotifyArgs) {
  try {
    const row = await prisma.notification.create({
      data: { userId, type: n.type, params: n.params ?? undefined, link: n.link },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, locale: true },
    });
    if (user?.email) {
      const r = renderNotification(n.type, n.params, user.locale);
      const sent = await sendEmail({
        to: user.email,
        subject: `Vakilim.az — ${r.title}`,
        text: `${r.body}${n.link ? `\n\n${r.linkLabel}: https://vakilim.az${n.link}` : ""}`,
      });
      if (sent.ok)
        await prisma.notification.update({
          where: { id: row.id },
          data: { emailedAt: new Date() },
        });
    }
  } catch (e) {
    console.error("notifyUser failed:", e);
  }
}

/** One unread "new message" alert per conversation, not one per message. */
export async function notifyNewMessageThrottled(
  recipientId: string,
  senderName: string,
  bookingId: string
) {
  try {
    const link = `/chat/${bookingId}`;
    const unread = await prisma.notification.count({
      where: { userId: recipientId, type: "NEW_MESSAGE", link, readAt: null },
    });
    if (unread > 0) return;
    await notifyUser(recipientId, {
      type: "NEW_MESSAGE",
      params: { sender: senderName },
      link,
    });
  } catch (e) {
    console.error("notifyNewMessageThrottled failed:", e);
  }
}

export const money = formatAzn;
