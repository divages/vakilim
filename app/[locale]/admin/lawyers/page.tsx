import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

const PILL: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
};

export default async function AdminLawyers() {
  const t = await getTranslations("adminReg");
  const rows = await prisma.lawyerProfile.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { fullName: true, phone: true } } },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("lawyersT")}
      </h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-slate">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("type")}</th>
              <th className="px-4 py-3">{t("city")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3">{t("joined")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  {p.user.fullName ?? "—"}
                  <span className="block text-xs font-normal text-slate">
                    {p.user.phone ?? ""}
                  </span>
                </td>
                <td className="px-4 py-3">{p.type}</td>
                <td className="px-4 py-3">{p.city}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[p.verificationStatus] ?? "bg-gray-100 text-slate-600"}`}>
                    {p.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate">
                  {p.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  {p.verificationStatus === "APPROVED" && p.slug ? (
                    <Link href={`/lawyers/${p.slug}`} className="font-medium text-emerald hover:underline">
                      {t("profile")} →
                    </Link>
                  ) : (
                    <Link href="/admin/verifications" className="font-medium text-emerald hover:underline">
                      {t("application")} →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
