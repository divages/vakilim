import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import { formatAzn } from "@/lib/money";

export function whenLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return `${bakuDateIso(d)} ${fmtMin(Math.round((d.getTime() - dayStart) / 60_000))}`;
}

type NotifyArgs = { type: string; title: string; body: string; link?: string };

/**
 * Dual-write: always create the in-app row; additionally email if the user
 * has an address. Never throws — notifications must not break the caller.
 */
export async function notifyUser(userId: string, n: NotifyArgs) {
  try {
    const row = await prisma.notification.create({
      data: { userId, ...n },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      const sent = await sendEmail({
        to: user.email,
        subject: `Vakilim.az — ${n.title}`,
        text: `${n.body}${n.link ? `\n\nKeçid: https://vakilim.az${n.link}` : ""}`,
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
      title: "Yeni mesaj",
      body: `${senderName} sizə yazdı.`,
      link,
    });
  } catch (e) {
    console.error("notifyNewMessageThrottled failed:", e);
  }
}

export const money = formatAzn;
