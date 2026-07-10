import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { rankLawyers, type SortMode } from "@/lib/ranking";
import { getTranslations } from "next-intl/server";
import Avatar from "@/components/avatar";
import { generateSlots, bakuDateIso, fmtMin, weekdayOfIso } from "@/lib/slots";

export const metadata = {
  title: "Vəkillər — Vakilim.az",
  description:
    "Azərbaycanda yoxlanılmış vəkillər və hüquqşünaslar. Axtarın, sahə, dil və qiymətə görə seçin.",
};

type Params = {
  q?: string;
  area?: string;
  lang?: string;
  type?: string;
  minRating?: string;
  maxPrice?: string;
  sort?: string;
};

function qs(current: Params, overrides: Partial<Params>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...current, ...overrides })) {
    if (v) merged[k] = v;
  }
  const s = new URLSearchParams(merged).toString();
  return s ? `?${s}` : "";
}

export default async function LawyersPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const t = await getTranslations();
  const { q, area, lang, type, minRating, maxPrice } = params;
  const sort: SortMode = (["rating", "experience", "price"] as const).includes(
    params.sort as SortMode
  )
    ? (params.sort as SortMode)
    : "rating";

  const areas = await prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAz: true },
  });

  const query = q?.trim();
  const rows = await prisma.lawyerProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      slug: { not: null },
      ...(area ? { practiceAreas: { some: { practiceArea: { slug: area } } } } : {}),
      ...(lang && ["az", "ru", "en"].includes(lang)
        ? { languages: { has: lang } }
        : {}),
      ...(type && ["ADVOCATE", "LICENSED_LAWYER"].includes(type)
        ? { type: type as "ADVOCATE" | "LICENSED_LAWYER" }
        : {}),
      ...(query
        ? {
            OR: [
              { user: { fullName: { contains: query, mode: "insensitive" } } },
              { bioAz: { contains: query, mode: "insensitive" } },
              { bioRu: { contains: query, mode: "insensitive" } },
              { bioEn: { contains: query, mode: "insensitive" } },
              { slug: { contains: slugify(query) } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { fullName: true } },
      practiceAreas: { include: { practiceArea: true } },
      services: { where: { active: true }, select: { priceQepik: true, durationMin: true } },
      reviews: { where: { hidden: false }, select: { stars: true } },
      _count: {
        select: { bookings: { where: { status: "COMPLETED" } } },
      },
    },
    take: 200,
  });

  const minRatingNum = minRating ? Number(minRating) : null;
  const maxPriceQepik = maxPrice ? Number(maxPrice) * 100 : null;

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
    })
    .filter((c) => (minRatingNum ? (c.ratingAvg ?? 0) >= minRatingNum : true))
    .filter((c) =>
      maxPriceQepik
        ? c.minPriceQepik !== null && c.minPriceQepik <= maxPriceQepik
        : true
    );

  const ranked = rankLawyers(cards, sort);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
      active
        ? "border-navy bg-navy text-white"
        : "border-gray-300 text-slate hover:border-navy"
    }`;
  const select =
    "rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy";

  const hasFilters = !!(q || area || lang || type || minRating || maxPrice);

  const ids = ranked.map((c) => c.id);
  const now = new Date();
  const [allRules, allBusy] =
    ids.length > 0
      ? await Promise.all([
          prisma.availabilityRule.findMany({
            where: { lawyerId: { in: ids } },
            select: { lawyerId: true, weekday: true, startMin: true, endMin: true },
          }),
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("directory.title")}</h1>
      <p className="mt-2 text-sm">
        {t("directory.subtitle")}
      </p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-3">
        {area && <input type="hidden" name="area" value={area} />}
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="block text-xs text-slate">
            {t("directory.search")}
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("directory.searchPh")}
            className="mt-1 w-full rounded-xl border border-gray-100 px-3 py-2 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label htmlFor="lang" className="block text-xs text-slate">
            {t("directory.lang")}
          </label>
          <select id="lang" name="lang" defaultValue={lang ?? ""} className={`mt-1 ${select}`}>
            <option value="">{t("directory.all")}</option>
            <option value="az">{t("common.langName.az")}</option>
            <option value="ru">{t("common.langName.ru")}</option>
            <option value="en">{t("common.langName.en")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-xs text-slate">
            {t("directory.type")}
          </label>
          <select id="type" name="type" defaultValue={type ?? ""} className={`mt-1 ${select}`}>
            <option value="">{t("directory.all")}</option>
            <option value="ADVOCATE">{t("common.lawyerType.ADVOCATE")}</option>
            <option value="LICENSED_LAWYER">{t("common.lawyerType.LICENSED_LAWYER")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="minRating" className="block text-xs text-slate">
            {t("directory.rating")}
          </label>
          <select id="minRating" name="minRating" defaultValue={minRating ?? ""} className={`mt-1 ${select}`}>
            <option value="">{t("directory.all")}</option>
            <option value="4">4.0+ ★</option>
            <option value="4.5">4.5+ ★</option>
          </select>
        </div>
        <div>
          <label htmlFor="maxPrice" className="block text-xs text-slate">
            {t("directory.maxPrice")}
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            defaultValue={maxPrice ?? ""}
            inputMode="numeric"
            placeholder="100"
            className={`mt-1 w-24 ${select}`}
          />
        </div>
        <div>
          <label htmlFor="sort" className="block text-xs text-slate">
            {t("directory.sort")}
          </label>
          <select id="sort" name="sort" defaultValue={sort} className={`mt-1 ${select}`}>
            <option value="rating">{t("directory.sortRating")}</option>
            <option value="experience">{t("directory.sortExp")}</option>
            <option value="price">{t("directory.sortPrice")}</option>
          </select>
        </div>
        <button className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark">
          {t("directory.submit")}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/lawyers${qs(params, { area: undefined })}`} className={chip(!area)}>
          {t("directory.all")}
        </Link>
        {areas.map((a) => (
          <Link
            key={a.slug}
            href={`/lawyers${qs(params, { area: a.slug })}`}
            className={chip(area === a.slug)}
          >
            {a.nameAz}
          </Link>
        ))}
      </div>

      <p className="mt-5 text-sm text-slate">
        {t("directory.results", { count: ranked.length })}
        {hasFilters && (
          <>
            {" · "}
            <Link href="/lawyers" className="text-emerald underline">
              {t("directory.reset")}
            </Link>
          </>
        )}
      </p>

      {ranked.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("directory.empty")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ranked.map((c) => (
            <Link
              key={c.id}
              href={`/lawyers/${c.slug}`}
              className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <Avatar name={c.name} profileId={c.id} hasPhoto={!!c.photoKey} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-navy">{c.name}</p>
                  {c.minPriceQepik !== null && (
                    <span className="whitespace-nowrap font-bold text-navy">
                      {t("directory.from", { price: formatAzn(c.minPriceQepik) })}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate">
                  {t(`common.lawyerType.${c.type}`)} · {c.city} ·{" "}
                  {t("directory.years", { y: c.yearsExperience })} ·{" "}
                  {c.languages.map((l) => l.toUpperCase()).join(", ")}
                </p>
                {nextLabel.has(c.id) && (
                  <p className="mt-1.5">
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {t("directory.next", { when: nextLabel.get(c.id)! })}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-sm">
                  {c.ratingAvg !== null ? (
                    <span className="font-semibold text-emerald">
                      ★ {c.ratingAvg.toFixed(1)}{" "}
                      <span className="font-normal text-slate">
                        {t("directory.reviewsCount", { c: c.reviewCount })}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate">{t("directory.noReviews")}</span>
                  )}
                  {c.completedCount > 0 && (
                    <span className="text-slate"> {t("directory.meetings", { c: c.completedCount })}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-slate">
                  {c.bio.slice(0, 140)}
                  {c.bio.length > 140 ? "…" : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.areas.map((a) => (
                    <span key={a} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
