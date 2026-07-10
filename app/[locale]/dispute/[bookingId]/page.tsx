import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canOpenDispute } from "@/lib/disputes";
import DisputeForm from "./dispute-form";

export default async function DisputePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
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
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Problem bildirin</h1>
      <p className="mt-2 text-sm">
        {booking.lawyer.user.fullName ?? "Vəkil"} ilə görüş barədə şikayətinizi
        yazın. Vəkilin 2 gün cavab müddəti var; qərarı platforma verir və
        ödənişin tam və ya qismən qaytarılması mümkündür.
      </p>
      <DisputeForm bookingId={booking.id} />
    </div>
  );
}
