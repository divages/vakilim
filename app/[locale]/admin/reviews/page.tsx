import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HideToggle from "./hide-toggle";

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lawyer: { select: { user: { select: { fullName: true } } } },
      booking: { select: { client: { select: { fullName: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Rəylər</h1>
      <p className="mt-2 text-sm">
        Gizlədilmiş rəylər profillərdə və reytinq hesabında iştirak etmir.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Hələ rəy yoxdur.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded border p-4 ${
                r.hidden ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">
                    {r.lawyer.user.fullName} ←{" "}
                    {(r.booking.client.fullName ?? "Müştəri").split(" ")[0]} ·{" "}
                    <span className="text-amber-500">{"★".repeat(r.stars)}</span>
                  </p>
                  {r.text && <p className="mt-2 text-sm">{r.text}</p>}
                  {r.lawyerReply && (
                    <p className="mt-2 text-xs text-slate">
                      Vəkilin cavabı: {r.lawyerReply}
                    </p>
                  )}
                </div>
                <HideToggle id={r.id} hidden={r.hidden} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
