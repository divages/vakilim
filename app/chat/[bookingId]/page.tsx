import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canMessage, isConversationVisible, FOLLOW_UP_HOURS } from "@/lib/messaging";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import ChatPanel from "./chat-panel";

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/chat/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      lawyer: { select: { userId: true, user: { select: { fullName: true } } } },
      client: { select: { fullName: true } },
    },
  });
  if (!booking) redirect("/bookings");

  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyer.userId === user.id;
  if (!isClient && !isLawyer) redirect("/");
  if (!isConversationVisible(booking.status))
    redirect(isClient ? "/bookings" : "/lawyer/bookings");

  const otherName = isClient
    ? booking.lawyer.user.fullName ?? "Vəkil"
    : booking.client.fullName ?? "Müştəri";
  const backHref = isClient ? "/bookings" : "/lawyer/bookings";
  const writable = canMessage(booking);

  return (
    <div className="mx-auto flex h-[calc(100dvh-120px)] max-w-2xl flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-navy">{otherName}</h1>
          <p className="text-xs text-slate">
            {bakuDateIso(booking.startAt)} · {bakuTimeLabel(booking.startAt)} ·{" "}
            {booking.durationMin} dəq
          </p>
        </div>
        <Link href={backHref} className="text-sm text-slate underline">
          Geri
        </Link>
      </div>

      {!writable && (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-xs">
          Yazışma bağlıdır — görüş bitdikdən {FOLLOW_UP_HOURS} saat sonra yalnız
          oxumaq mümkündür.
        </p>
      )}

      <ChatPanel bookingId={booking.id} meId={user.id} writable={writable} />
    </div>
  );
}
