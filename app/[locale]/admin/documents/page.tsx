import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { formatAzn } from "@/lib/money";

export default async function AdminDocuments() {
  const t = await getTranslations("adminReg");
  const orders = await prisma.docOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const users = orders.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(orders.map((o) => o.userId))] } },
        select: { id: true, fullName: true, phone: true },
      })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          {t("docsT")}
        </h1>
        <Link href="/admin/templates" className="text-sm font-medium text-emerald hover:underline">
          {t("templates")} →
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-slate">
            <tr>
              <th className="px-4 py-3">{t("date")}</th>
              <th className="px-4 py-3">{t("buyer")}</th>
              <th className="px-4 py-3">UID</th>
              <th className="px-4 py-3">{t("price")}</th>
              <th className="px-4 py-3">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => {
              const u = byId.get(o.userId);
              return (
                <tr key={o.id}>
                  <td className="px-4 py-3 text-slate">
                    {o.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy">
                    {u?.fullName ?? "—"}
                    <span className="block text-xs font-normal text-slate">{u?.phone ?? ""}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{o.docUid}</td>
                  <td className="px-4 py-3">{formatAzn(o.priceQepik)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.paidAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {o.paidAt ? t("paid") : o.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
