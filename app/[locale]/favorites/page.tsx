import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatAzn } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import Avatar from "@/components/avatar";
import FavoriteButton from "@/components/favorite-button";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/");
  const t = await getTranslations();

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      lawyer: {
        include: {
          user: { select: { fullName: true } },
          services: { where: { active: true }, select: { priceQepik: true } },
        },
      },
    },
  });
  const rows = favorites.filter(
    (f) => f.lawyer.verificationStatus === "APPROVED" && f.lawyer.slug
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("fav.title")}
      </h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-slate">{t("fav.empty")}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((f) => {
            const p = f.lawyer;
            const min =
              p.services.length > 0
                ? Math.min(...p.services.map((s) => s.priceQepik))
                : null;
            return (
              <Link
                key={f.id}
                href={`/lawyers/${p.slug}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <Avatar
                  name={p.user.fullName ?? "—"}
                  profileId={p.id}
                  hasPhoto={!!p.photoKey}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-navy">{p.user.fullName ?? "—"}</p>
                  <p className="text-sm text-slate">
                    {t(`common.lawyerType.${p.type}`)} · {p.city}
                    {min !== null && (
                      <> · {t("directory.from", { price: formatAzn(min) })}</>
                    )}
                  </p>
                </div>
                <FavoriteButton profileId={p.id} initial={true} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
