import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReplyForm from "./reply-form";

const TAG_LABELS: Record<string, string> = {
  clear: "Aydın izahat",
  on_time: "Vaxtında",
  solved: "Problemi həll etdi",
  professional: "Peşəkar yanaşma",
};

export default async function LawyerReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/reviews");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const reviews = await prisma.review.findMany({
    where: { lawyerId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { client: { select: { fullName: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Rəylər</h1>
      <p className="mt-2 text-sm">
        Hər rəyə bir dəfə cavab yaza bilərsiniz — cavab ictimai profilinizdə
        görünür.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Hələ rəy yoxdur.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy">
                  {(r.booking.client.fullName ?? "Müştəri").split(" ")[0]}
                </p>
                <p className="text-sm text-amber-500">
                  {"★".repeat(r.stars)}
                  <span className="text-gray-300">{"★".repeat(5 - r.stars)}</span>
                </p>
              </div>
              {r.tags.length > 0 && (
                <p className="mt-1 text-xs text-slate">
                  {r.tags.map((t) => TAG_LABELS[t] ?? t).join(" · ")}
                </p>
              )}
              {r.text && <p className="mt-2 text-sm">{r.text}</p>}
              {r.hidden && (
                <p className="mt-2 text-xs text-red-700">
                  Bu rəy moderasiya ilə gizlədilib.
                </p>
              )}
              {r.lawyerReply ? (
                <p className="mt-3 rounded border-l-2 border-navy/30 bg-gray-50 p-2 text-sm">
                  <b className="text-navy">Cavabınız:</b> {r.lawyerReply}
                </p>
              ) : (
                <ReplyForm reviewId={r.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
