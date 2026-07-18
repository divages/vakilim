import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canOpenDispute } from "@/lib/disputes";
import DisputeForm from "./dispute-form";
import { getTranslations } from "next-intl/server";

export default async function DisputePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const t = await getTranslations();
  const { bookingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dispute/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      dispute: true,
      lawyer: { select: { user: { select: { fullName: true } } } },
    },
  });
  if (!booking || booking.clientId !== user.id) redirect("/bookings");
  if (booking.dispute || !canOpenDispute(booking.status, booking.endAt))
    redirect("/bookings");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("dispute.title")}</h1>
      <p className="mt-2 text-sm">
        {t("dispute.intro", { name: booking.lawyer.user.fullName ?? t("common.lawyer") })}
      </p>
      <DisputeForm bookingId={booking.id} />
    </div>
  );
}
