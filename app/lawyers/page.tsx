import Link from "next/link";
import { prisma } from "@/lib/prisma";

const TYPE_LABELS: Record<string, string> = {
  ADVOCATE: "Vəkil",
  LICENSED_LAWYER: "Hüquqşünas",
};

export const metadata = {
  title: "Vəkillər — Vakilim.az",
  description:
    "Azərbaycanda yoxlanılmış vəkillər və hüquqşünaslar. Sahə üzrə seçin.",
};

export default async function LawyersPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;

  const areas = await prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAz: true },
  });

  const lawyers = await prisma.lawyerProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      slug: { not: null },
      ...(area
        ? { practiceAreas: { some: { practiceArea: { slug: area } } } }
        : {}),
    },
    include: {
      user: { select: { fullName: true } },
      practiceAreas: { include: { practiceArea: true } },
    },
    orderBy: [{ yearsExperience: "desc" }, { createdAt: "asc" }],
  });

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
      active
        ? "border-navy bg-navy text-white"
        : "border-gray-300 text-slate hover:border-navy"
    }`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Vəkillər</h1>
      <p className="mt-2 text-sm">
        Yalnız yoxlanılmış və təsdiqlənmiş hüquqçular göstərilir.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/lawyers" className={chip(!area)}>
          Hamısı
        </Link>
        {areas.map((a) => (
          <Link
            key={a.slug}
            href={`/lawyers?area=${a.slug}`}
            className={chip(area === a.slug)}
          >
            {a.nameAz}
          </Link>
        ))}
      </div>

      {lawyers.length === 0 ? (
        <p className="mt-8 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Bu sahə üzrə vəkil tapılmadı. Başqa sahə seçin.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lawyers.map((p) => (
            <Link
              key={p.id}
              href={`/lawyers/${p.slug}`}
              className="rounded border border-gray-200 p-4 transition hover:border-navy"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-navy">
                  {p.user.fullName ?? "—"}
                </p>
                <span className="rounded bg-navy/5 px-2 py-1 text-xs font-medium text-navy">
                  {TYPE_LABELS[p.type]}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {p.city} · {p.yearsExperience ?? 0} il təcrübə ·{" "}
                {p.languages.map((l) => l.toUpperCase()).join(", ")}
              </p>
              <p className="mt-2 text-sm text-slate">
                {(p.bio ?? "").slice(0, 140)}
                {(p.bio ?? "").length > 140 ? "…" : ""}
              </p>
              <p className="mt-3 text-xs text-slate">
                {p.practiceAreas.map((pa) => pa.practiceArea.nameAz).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
