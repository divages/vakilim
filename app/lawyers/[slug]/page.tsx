import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth";
import BookingWidget from "./booking-widget";

const TYPE_LABELS: Record<string, string> = {
  ADVOCATE: "Vəkil (Vəkillər Kollegiyasının üzvü)",
  LICENSED_LAWYER: "Hüquqşünas",
};

const SERVICE_LABELS: Record<string, string> = {
  VIDEO: "Video görüş",
  AUDIO: "Səsli zəng",
  WRITTEN: "Yazılı cavab",
  DOC_REVIEW: "Sənəd yoxlanışı",
};

const TAG_LABELS: Record<string, string> = {
  clear: "Aydın izahat",
  on_time: "Vaxtında",
  solved: "Problemi həll etdi",
  professional: "Peşəkar yanaşma",
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

      {profile.services.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
            Xidmətlər
          </h2>
          <div className="mt-2 divide-y divide-gray-100 rounded border border-gray-200">
            {profile.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-navy">
                  {SERVICE_LABELS[s.type]}
                  {s.durationMin ? ` · ${s.durationMin} dəq` : ""}
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
            Rəylər (
            {(
              profile.reviews.reduce((a, r) => a + r.stars, 0) /
              profile.reviews.length
            ).toFixed(1)}{" "}
            ★ · {profile.reviews.length})
          </h2>
          <div className="mt-2 space-y-3">
            {profile.reviews.map((r) => (
              <div key={r.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy">
                    {(r.booking.client.fullName ?? "Müştəri").split(" ")[0]}
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
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy"
                      >
                        {TAG_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}
                {r.text && <p className="mt-2 text-sm">{r.text}</p>}
                {r.lawyerReply && (
                  <p className="mt-2 rounded border-l-2 border-navy/30 bg-gray-50 p-2 text-sm">
                    <b className="text-navy">Vəkilin cavabı:</b>{" "}
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
