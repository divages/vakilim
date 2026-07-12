import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { formatAzn } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth";
import BookingWidget from "./booking-widget";
import Avatar from "@/components/avatar";
import FavoriteButton from "@/components/favorite-button";
import { Link } from "@/i18n/navigation";
import { pickL } from "@/lib/locale-pick";

async function loadProfile(slug: string) {
  return prisma.lawyerProfile.findFirst({
    where: { slug, verificationStatus: "APPROVED" },
    include: {
      user: { select: { fullName: true } },
      practiceAreas: { include: { practiceArea: true } },
      services: {
        where: { active: true },
        orderBy: { priceQepik: "asc" },
      },
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          booking: {
            select: { client: { select: { fullName: true } } },
          },
        },
      },
    },
  });
}


function pickBio(
  p: { bioAz: string | null; bioRu: string | null; bioEn: string | null },
  locale: string
): string {
  const byLocale =
    locale === "ru" ? p.bioRu : locale === "en" ? p.bioEn : p.bioAz;
  return byLocale ?? p.bioAz ?? p.bioRu ?? p.bioEn ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  const profile = await loadProfile(slug);
  if (!profile) return { title: tMeta("lawyerNotFound") };
  const name = profile.user.fullName ?? "Vəkil";
  return {
    title: `${name} — Vakilim.az`,
    description: pickBio(profile, locale).slice(0, 160),
    alternates: {
      canonical: `/${locale}/lawyers/${slug}`,
      languages: {
        az: `/az/lawyers/${slug}`,
        ru: `/ru/lawyers/${slug}`,
        en: `/en/lawyers/${slug}`,
      },
    },
  };
}

export default async function LawyerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations();
  const [profile, viewer] = await Promise.all([
    loadProfile(slug),
    getCurrentUser(),
  ]);
  if (!profile) notFound();

  const callServices = profile.services
    .filter((s) => s.type === "VIDEO" || s.type === "AUDIO")
    .map((s) => ({
      id: s.id,
      type: s.type as "VIDEO" | "AUDIO",
      durationMin: s.durationMin,
      priceQepik: s.priceQepik,
    }));

  const favInitial =
    viewer?.role === "CLIENT"
      ? !!(await prisma.favorite.findUnique({
          where: {
            userId_lawyerProfileId: {
              userId: viewer.id,
              lawyerProfileId: profile.id,
            },
          },
          select: { id: true },
        }))
      : null;

  const articles = await prisma.post.findMany({
    where: {
      authorLawyerId: profile.id,
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-start gap-6">
        <Avatar
          name={profile.user.fullName ?? "—"}
          profileId={profile.id}
          hasPhoto={!!profile.photoKey}
          size="lg"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">
              {profile.user.fullName ?? "—"}
            </h1>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {t("profile.verified")} ✓
            </span>
            {favInitial !== null && (
              <FavoriteButton profileId={profile.id} initial={favInitial} />
            )}
          </div>
          <p className="mt-1 text-sm text-slate">{t(`common.lawyerTypeFull.${profile.type}`)}</p>
          <p className="mt-1 text-sm text-slate">
            {profile.city} · {t("directory.years", { y: profile.yearsExperience ?? 0 })} ·{" "}
            {profile.languages.map((l) => t(`common.langName.${l}`)).join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.practiceAreas.map((pa) => (
          <Link
            href={`/areas/${pa.practiceArea.slug}`}
            key={pa.practiceAreaId}
            className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            {locale === "ru"
              ? pa.practiceArea.nameRu ?? pa.practiceArea.nameAz
              : locale === "en"
                ? pa.practiceArea.nameEn ?? pa.practiceArea.nameAz
                : pa.practiceArea.nameAz}
          </Link>
        ))}
      </div>

      {articles.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate">
            {t("profile.articlesH")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs text-slate">
                  {a.publishedAt!.toISOString().slice(0, 10)}
                </p>
                <p className="mt-1 line-clamp-2 font-semibold text-navy">
                  {pickL(a, "title", locale)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        {t("profile.about")}
      </h2>
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">
        {pickBio(profile, locale)}
      </p>

      {profile.services.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
            {t("profile.services")}
          </h2>
          <div className="mt-2 divide-y divide-gray-100 rounded-2xl border border-gray-100 shadow-sm">
            {profile.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-navy">
                  {t(`common.serviceType.${s.type}`)}
                  {s.durationMin ? ` · ${s.durationMin} ${t("common.min")}` : ""}
                </span>
                <span className="font-semibold text-navy">
                  {formatAzn(s.priceQepik)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {profile.reviews.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
            {t("profile.reviews")} (
            {(
              profile.reviews.reduce((a, r) => a + r.stars, 0) /
              profile.reviews.length
            ).toFixed(1)}{" "}
            ★ · {profile.reviews.length})
          </h2>
          <div className="mt-2 space-y-3">
            {profile.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-gray-100 shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy">
                    {(r.booking.client.fullName ?? t("common.client")).split(" ")[0]}
                  </p>
                  <p className="text-sm text-amber-500">
                    {"★".repeat(r.stars)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - r.stars)}
                    </span>
                  </p>
                </div>
                {r.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy"
                      >
                        {t(`common.tags.${tag}`)}
                      </span>
                    ))}
                  </div>
                )}
                {r.text && <p className="mt-2 text-sm">{r.text}</p>}
                {r.lawyerReply && (
                  <p className="mt-2 rounded border-l-2 border-navy/30 bg-gray-50 p-2 text-sm">
                    <b className="text-navy">{t("profile.reply")}</b>{" "}
                    {r.lawyerReply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <BookingWidget
        lawyerSlug={slug}
        services={callServices}
        loggedIn={!!viewer}
        bookingMode={profile.bookingMode}
      />
    </div>
  );
}
