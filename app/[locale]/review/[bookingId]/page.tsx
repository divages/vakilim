import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReview } from "@/lib/disputes";
import ReviewForm from "./review-form";
import { getTranslations } from "next-intl/server";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const t = await getTranslations();
  const { bookingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/review/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      review: true,
      payment: true,
      lawyer: { select: { user: { select: { fullName: true } } } },
    },
  });
  if (!booking || booking.clientId !== user.id) redirect("/bookings");
  if (booking.review || !canReview(booking.status) || !booking.payment)
    redirect("/bookings");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("review.title")}</h1>
      <p className="mt-2 text-sm">
        {t("review.q", { name: booking.lawyer.user.fullName ?? t("common.lawyer") })}
      </p>
      <ReviewForm bookingId={booking.id} />
    </div>
  );
}
