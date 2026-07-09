import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const TYPE_LABELS: Record<string, string> = {
  ADVOCATE: "Vəkil (Vəkillər Kollegiyasının üzvü)",
  LICENSED_LAWYER: "Hüquqşünas",
};

const LANG_LABELS: Record<string, string> = {
  az: "Azərbaycan",
  ru: "Rus",
  en: "İngilis",
};

async function loadProfile(slug: string) {
  return prisma.lawyerProfile.findFirst({
    where: { slug, verificationStatus: "APPROVED" },
    include: {
      user: { select: { fullName: true } },
      practiceAreas: { include: { practiceArea: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return { title: "Vəkil tapılmadı — Vakilim.az" };
  const name = profile.user.fullName ?? "Vəkil";
  return {
    title: `${name} — Vakilim.az`,
    description: (profile.bio ?? "").slice(0, 160),
  };
}

export default async function LawyerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {profile.user.fullName ?? "—"}
          </h1>
          <p className="mt-1 text-sm">{TYPE_LABELS[profile.type]}</p>
        </div>
        <span className="rounded bg-emerald/15 px-2 py-1 text-xs font-medium text-navy">
          Yoxlanılıb ✓
        </span>
      </div>

      <p className="mt-4 text-sm">
        {profile.city} · {profile.yearsExperience ?? 0} il təcrübə ·{" "}
        {profile.languages.map((l) => LANG_LABELS[l] ?? l).join(", ")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.practiceAreas.map((pa) => (
          <span
            key={pa.practiceAreaId}
            className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy"
          >
            {pa.practiceArea.nameAz}
          </span>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        Haqqında
      </h2>
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">
        {profile.bio}
      </p>

      <button
        disabled
        title="Onlayn görüşlər tezliklə əlavə olunacaq"
        className="mt-10 w-full cursor-not-allowed rounded bg-navy py-3 font-medium text-white opacity-50"
      >
        Onlayn görüş — tezliklə
      </button>
    </div>
  );
}
