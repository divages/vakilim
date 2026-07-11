import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("adminReg");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const rows = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("usersT")}
      </h1>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPh")}
          className="w-full max-w-md rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald"
        />
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-slate">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("contact")}</th>
              <th className="px-4 py-3">{t("role")}</th>
              <th className="px-4 py-3">{t("verifiedCols")}</th>
              <th className="px-4 py-3">{t("bookings")}</th>
              <th className="px-4 py-3">{t("joined")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-navy">{u.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-slate">
                  {u.email ?? "—"}
                  <span className="block text-xs">{u.phone ?? ""}</span>
                </td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  <span title="email">{u.emailVerifiedAt ? "✉✓" : "✉—"}</span>{" "}
                  <span title="phone">{u.phoneVerifiedAt ? "☎✓" : "☎—"}</span>
                </td>
                <td className="px-4 py-3">{u._count.bookings}</td>
                <td className="px-4 py-3 text-slate">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate">{t("readOnly")}</p>
    </div>
  );
}
