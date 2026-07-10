import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { lawyerResponseDeadline } from "@/lib/disputes";
import { presignRecordingUrl } from "@/lib/storage";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import ResolveControls from "./resolve-controls";

const REASON_LABELS: Record<string, string> = {
  no_show: "Vəkil görüşə gəlmədi",
  technical: "Texniki problem",
  quality: "Xidmət keyfiyyəti",
  other: "Digər",
};

const RESOLUTION_LABELS: Record<string, string> = {
  FULL_REFUND: "Tam geri qaytarma",
  PARTIAL_REFUND: "Qismən geri qaytarma",
  DISMISSED: "Rədd edilib",
};

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function AdminDisputesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const disputes = await prisma.dispute.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: {
      booking: {
        include: {
          client: { select: { fullName: true, phone: true } },
          lawyer: { select: { user: { select: { fullName: true } } } },
          payment: true,
          session: { select: { recordingKey: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, body: true, senderId: true, createdAt: true },
          },
        },
      },
    },
  });

  const now = new Date();
  const rows = await Promise.all(
    disputes.map(async (d) => ({
      d,
      recordingUrl: d.booking.session?.recordingKey
        ? await presignRecordingUrl(d.booking.session.recordingKey)
        : null,
      overdue:
        d.status === "OPEN" && now > lawyerResponseDeadline(d.createdAt),
      remaining: d.booking.payment
        ? d.booking.payment.amountQepik - d.booking.payment.refundedQepik
        : 0,
    }))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Mübahisələr</h1>

      {rows.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Şikayət yoxdur.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map(({ d, recordingUrl, overdue, remaining }) => (
            <div
              key={d.id}
              className={`rounded border p-4 ${
                overdue ? "border-red-300 bg-red-50/50" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">
                    {d.booking.lawyer.user.fullName} ×{" "}
                    {d.booking.client.fullName} ·{" "}
                    {REASON_LABELS[d.reason] ?? d.reason}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Görüş: {bakuDateIso(d.booking.startAt)} ·{" "}
                    {bakuTimeLabel(d.booking.startAt)} · Ödəniş:{" "}
                    {d.booking.payment
                      ? formatAzn(d.booking.payment.amountQepik)
                      : "—"}{" "}
                    · Qalıq: {formatAzn(remaining)}
                  </p>
                  {overdue && (
                    <p className="mt-1 text-xs font-medium text-red-700">
                      Vəkilin cavab müddəti bitib
                    </p>
                  )}
                </div>
                <span className="rounded bg-navy/10 px-2 py-1 text-xs font-medium text-navy">
                  {d.status === "RESOLVED"
                    ? RESOLUTION_LABELS[d.resolution ?? ""] ?? "Həll olunub"
                    : d.status === "RESPONDED"
                      ? "Cavab verilib"
                      : "Açıq"}
                </span>
              </div>

              <p className="mt-3 rounded bg-gray-50 p-3 text-sm">
                <b className="text-navy">Müştəri:</b> {d.description}
              </p>
              {d.lawyerResponse && (
                <p className="mt-2 rounded bg-gray-50 p-3 text-sm">
                  <b className="text-navy">Vəkil:</b> {d.lawyerResponse}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {recordingUrl && (
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-gray-300 px-3 py-1.5 text-navy hover:border-navy"
                  >
                    🎥 Görüş yazısı
                  </a>
                )}
              </div>

              {d.booking.messages.length > 0 && (
                <div className="mt-3 rounded border border-gray-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">
                    Son yazışma
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    {[...d.booking.messages].reverse().map((m) => (
                      <p key={m.id}>
                        <b className="text-navy">
                          {m.senderId === d.clientId ? "Müştəri" : "Vəkil"}:
                        </b>{" "}
                        {m.body || "📎 fayl"}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {d.status !== "RESOLVED" && (
                <ResolveControls
                  disputeId={d.id}
                  remainingQepik={remaining}
                />
              )}
              {d.status === "RESOLVED" && d.refundQepik > 0 && (
                <p className="mt-3 text-sm text-emerald">
                  Geri qaytarıldı: {formatAzn(d.refundQepik)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
