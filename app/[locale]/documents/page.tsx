import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/documents");

  const orders = await prisma.docOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { templateVersion: { include: { template: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Sənədlərim</h1>

      {orders.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Hələ sənədiniz yoxdur.{" "}
          <Link href="/templates" className="text-emerald underline">
            Şablon seçin
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">
                    {o.templateVersion.template.title}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    № {o.docUid} ·{" "}
                    {o.createdAt.toLocaleDateString("az-AZ", {
                      timeZone: "Asia/Baku",
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {o.priceQepik === 0 ? "Pulsuz" : formatAzn(o.priceQepik)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {o.status === "PAID" ? (
                  <a
                    href={`/api/doc-orders/${o.id}/download`}
                    className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                  >
                    Yüklə (PDF)
                  </a>
                ) : (
                  <Link
                    href={`/doc-pay/${o.id}`}
                    className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                  >
                    Ödənişi tamamla
                  </Link>
                )}
                <Link
                  href={`/verify?code=${o.docUid}`}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-navy hover:border-navy"
                >
                  Yoxlama səhifəsi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
