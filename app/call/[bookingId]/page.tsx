import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  GRACE_AFTER_END_MIN,
  isJoinable,
  minutesUntilJoinable,
} from "@/lib/call-window";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import CallRoom from "./call-room";

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function CallPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/call/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      lawyer: { select: { userId: true, user: { select: { fullName: true } } } },
      client: { select: { fullName: true, phone: true } },
    },
  });
  if (!booking) redirect("/bookings");

  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyer.userId === user.id;
  if (!isClient && !isLawyer) redirect("/");

  const backHref = isClient ? "/bookings" : "/lawyer/bookings";
  const otherName = isClient
    ? booking.lawyer.user.fullName ?? "Vəkil"
    : booking.client.fullName ?? "Müştəri";

  const now = new Date();

  if (booking.status === "COMPLETED" || now.getTime() > booking.endAt.getTime() + GRACE_AFTER_END_MIN * 60_000) {
    return (
      <Notice backHref={backHref} title="Görüş başa çatıb">
        Bu görüşün vaxtı bitib.
      </Notice>
    );
  }

  if (booking.status !== "CONFIRMED") {
    return (
      <Notice backHref={backHref} title="Görüş aktiv deyil">
        Bu görüş təsdiqlənməyib və ya ləğv edilib.
      </Notice>
    );
  }

  if (!isJoinable(booking.startAt, booking.endAt, now)) {
    const mins = minutesUntilJoinable(booking.startAt, now);
    return (
      <Notice backHref={backHref} title="Hələ tezdir">
        Görüş {bakuDateIso(booking.startAt)} · {bakuTimeLabel(booking.startAt)}
        -də başlayır. Qoşulma {mins} dəqiqə sonra açılır — bu səhifəni yeniləyin.
      </Notice>
    );
  }

  return (
    <CallRoom
      bookingId={booking.id}
      backHref={backHref}
      otherName={otherName}
      durationMin={booking.durationMin}
    />
  );
}

function Notice({
  title,
  children,
  backHref,
}: {
  title: string;
  children: React.ReactNode;
  backHref: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-navy">{title}</h1>
      <p className="mt-3 text-sm">{children}</p>
      <Link
        href={backHref}
        className="mt-8 inline-block rounded bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
      >
        Görüşlərə qayıt
      </Link>
    </div>
  );
}
