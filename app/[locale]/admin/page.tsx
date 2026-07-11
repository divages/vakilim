import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboard() {
  const t = await getTranslations("adminNav");
  const [pendingVer, openDisp, flags, drafts] = await Promise.all([
    prisma.lawyerProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.message.count({ where: { flagged: true } }),
    prisma.post.count({ where: { publishedAt: null } }),
  ]);
  const tiles = [
    { label: t("ver"), value: pendingVer, href: "/admin/verifications" },
    { label: t("disp"), value: openDisp, href: "/admin/disputes" },
    { label: t("flags"), value: flags, href: "/admin/flags" },
    { label: t("draftPosts"), value: drafts, href: "/admin/posts" },
  ];
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("dash")}
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase text-slate">{x.label}</p>
            <p
              className={`mt-1 text-3xl font-extrabold ${
                x.value > 0 ? "text-navy" : "text-gray-300"
              }`}
            >
              {x.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
