import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REASON_LABELS: Record<string, string> = {
  PHONE: "Telefon nömrəsi",
  EMAIL: "E-poçt",
  MESSENGER: "Messencer",
};

export default async function AdminFlagsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const flagged = await prisma.message.findMany({
    where: { flagged: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sender: { select: { fullName: true, phone: true, role: true } },
      booking: {
        include: {
          client: { select: { fullName: true } },
          lawyer: { select: { user: { select: { fullName: true } } } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Moderasiya</h1>
      <p className="mt-2 text-sm">
        Platformadan kənara çıxma cəhdi kimi işarələnmiş mesajlar. Mesajlar
        çatdırılır — bura yalnız nəzarət üçündür.
      </p>

      {flagged.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          İşarələnmiş mesaj yoxdur.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {flagged.map((m) => (
            <div key={m.id} className="rounded border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-navy">
                  {m.sender.fullName ?? m.sender.phone ?? "İstifadəçi"}{" "}
                  <span className="font-normal text-slate">
                    ({m.sender.role === "LAWYER" ? "vəkil" : "müştəri"}) —{" "}
                    {m.booking.lawyer.user.fullName} ×{" "}
                    {m.booking.client.fullName}
                  </span>
                </p>
                <div className="flex gap-1">
                  {m.flagReasons.map((r) => (
                    <span
                      key={r}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                    >
                      {REASON_LABELS[r] ?? r}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 rounded bg-gray-50 p-3 text-sm">{m.body}</p>
              <p className="mt-1 text-xs text-slate">
                {m.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
