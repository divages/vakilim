import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import Avatar from "@/components/avatar";
import FavoriteButton from "@/components/favorite-button";
import { formatAzn } from "@/lib/money";
import { renderLiteMarkdown } from "@/lib/markdown-lite";
import { pickL, areaNameL } from "@/lib/locale-pick";
import { generateSlots, bakuDateIso, fmtMin, weekdayOfIso } from "@/lib/slots";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const area = await prisma.practiceArea.findUnique({ where: { slug } });
  if (!area) return {};
  const t = await getTranslations({ locale, namespace: "areas" });
  const name = areaNameL(area, locale);
  return {
    title: t("metaTitle", { name }),
    description: t("intro", { name }),
    alternates: {
      canonical: `/${locale}/areas/${slug}`,
      languages: {
        az: `/az/areas/${slug}`,
        ru: `/ru/areas/${slug}`,
        en: `/en/areas/${slug}`,
        "x-default": `/az/areas/${slug}`,
      },
    },
  };
}

export default async function AreaLanding({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const area = await prisma.practiceArea.findUnique({ where: { slug } });
  if (!area) notFound();
  const t = await getTranslations();
  const name = areaNameL(area, locale);

const rows = await prisma.lawyerProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      slug: { not: null },
      practiceAreas: { some: { practiceArea: { slug } } },
    },
    take: 50,
    include: {
      user: { select: { fullName: true } },
      practiceAreas: { include: { practiceArea: true } },
      services: { where: { active: true }, select: { priceQepik: true, durationMin: true } },
      reviews: { where: { hidden: false }, select: { stars: true } },
      _count: {
        select: { bookings: { where: { status: "COMPLETED" } } },
      },
    },
  });;

  const cards = rows
    .map((p) => {
      const ratingAvg =
        p.reviews.length > 0
          ? p.reviews.reduce((a, r) => a + r.stars, 0) / p.reviews.length
          : null;
      const minPriceQepik =
        p.services.length > 0
          ? Math.min(...p.services.map((s) => s.priceQepik))
          : null;
      const cheapest =
        p.services.length > 0
          ? p.services.reduce((a, sv) => (sv.priceQepik < a.priceQepik ? sv : a))
          : null;
      return {
        id: p.id,
        slug: p.slug as string,
        name: p.user.fullName ?? "—",
        type: p.type,
        city: p.city,
        yearsExperience: p.yearsExperience ?? 0,
        languages: p.languages,
        bio: p.bioAz ?? p.bioRu ?? p.bioEn ?? "",
        areas: p.practiceAreas.map((pa) => pa.practiceArea.nameAz),
        photoKey: p.photoKey,
        minSvcDuration: cheapest?.durationMin ?? null,
        bufferMin: p.bufferMin,
        ratingAvg,
        reviewCount: p.reviews.length,
        completedCount: p._count.bookings,
        minPriceQepik,
      };
    });

  const ranked = cards;

  const ids = ranked.map((c) => c.id);
  const now = new Date();
  const [allRules, allBusy] =
    ids.length > 0
      ? await Promise.all([
          // unbounded-ok: naturally bounded set
          prisma.availabilityRule.findMany({
            where: { lawyerId: { in: ids } },
            select: { lawyerId: true, weekday: true, startMin: true, endMin: true },
          }),
          // unbounded-ok: bounded by ids set
          prisma.booking.findMany({
            where: {
              lawyerId: { in: ids },
              status: { in: ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] },
              endAt: { gt: now },
            },
            select: { lawyerId: true, startAt: true, endAt: true },
          }),
        ])
      : [[], []];
  const rulesBy = new Map<string, typeof allRules>();
  for (const r of allRules)
    (rulesBy.get(r.lawyerId) ?? rulesBy.set(r.lawyerId, []).get(r.lawyerId)!).push(r);
  const busyBy = new Map<string, typeof allBusy>();
  for (const b of allBusy)
    (busyBy.get(b.lawyerId) ?? busyBy.set(b.lawyerId, []).get(b.lawyerId)!).push(b);
  const viewer = await getCurrentUser();
  const favSet =
    viewer?.role === "CLIENT" && ids.length > 0
      ? new Set(
          (
            await prisma.favorite.findMany({
              where: { userId: viewer.id, lawyerProfileId: { in: ids } },
              select: { lawyerProfileId: true },
            })
          ).map((f) => f.lawyerProfileId)
        )
      : null;
  const nextLabel = new Map<string, string>();
  for (const c of ranked) {
    if (!c.minSvcDuration) continue;
    const slots = generateSlots({
      rules: rulesBy.get(c.id) ?? [],
      bufferMin: c.bufferMin,
      durationMin: c.minSvcDuration,
      days: 7,
      now,
      busy: busyBy.get(c.id) ?? [],
    });
    const first = slots[0];
    if (!first) continue;
    const d = first.startAt;
    const dayIso = bakuDateIso(d);
    const mins = Math.round(
      (d.getTime() - new Date(`${dayIso}T00:00:00+04:00`).getTime()) / 60_000
    );
    nextLabel.set(
      c.id,
      `${t(`common.wd.${weekdayOfIso(dayIso)}`)} ${fmtMin(mins)}`
    );
  }


  const [qa, posts] = await Promise.all([
    prisma.qaEntry.findMany({
      where: { practiceAreaSlug: slug, publishedAt: { not: null, lte: new Date() } },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.post.findMany({
      where: { practiceAreaSlug: slug, publishedAt: { not: null, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{name}</h1>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald">
        <Link href="/areas" className="hover:underline">{t("areas.title")}</Link>
      </p>
      <p className="mt-3 max-w-2xl text-slate">{t("areas.intro", { name })}</p>
      <Link
        href="/intake"
        className="mt-4 inline-block rounded-xl border border-emerald/40 bg-emerald-50/50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald"
      >
        {t("areas.cta")}
      </Link>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-slate">
        {t("areas.lawyersH", { n: rows.length })}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-slate">{t("areas.empty")}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map((p) => {
            const min =
              p.services.length > 0
                ? Math.min(...p.services.map((s) => s.priceQepik))
                : null;
            const rating =
              p.reviews.length > 0
                ? p.reviews.reduce((a, r) => a + r.stars, 0) / p.reviews.length
                : null;
            return (
              <Link
                key={p.id}
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
                    {rating !== null && (
                      <> · <span className="font-semibold text-emerald">★ {rating.toFixed(1)}</span></>
                    )}
                    {min !== null && <> · {t("directory.from", { price: formatAzn(min) })}</>}
                  </p>
                  {nextLabel.get(p.id) && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      ⏱ {nextLabel.get(p.id)}
                    </span>
                  )}
                </div>
                {favSet && (
                  <FavoriteButton
                    profileId={p.id}
                    initial={favSet.has(p.id)}
                    className="self-start"
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {qa.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate">
            {t("areas.qaH")}
          </h2>
          <div className="mt-4 space-y-3">
            {qa.map((r) => (
              <details
                key={r.id}
                className="group rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-navy">
                  {pickL(r, "question", locale)}
                  <span className="float-right text-slate transition group-open:rotate-45">+</span>
                </summary>
                <div
                  className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 [&_a]:text-emerald [&_a]:underline"
                  dangerouslySetInnerHTML={{
                    __html: renderLiteMarkdown(pickL(r, "answer", locale)),
                  }}
                />
              </details>
            ))}
          </div>
          <Link href="/qa" className="mt-3 inline-block text-sm font-medium text-emerald hover:underline">
            {t("areas.qaAll")} →
          </Link>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate">
            {t("areas.postsH")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {posts.map((po) => (
              <Link
                key={po.id}
                href={`/${po.kind === "BLOG" ? "blog" : "news"}/${po.slug}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs text-slate">
                  {po.publishedAt!.toISOString().slice(0, 10)}
                </p>
                <p className="mt-1 line-clamp-2 font-semibold text-navy">
                  {pickL(po, "title", locale)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
