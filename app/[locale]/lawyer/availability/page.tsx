import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateSlots,
} from "@/lib/slots";
import AvailabilityManager from "./availability-manager";
import { getTranslations } from "next-intl/server";

export default async function AvailabilityPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/availability");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, bufferMin: true, bookingMode: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const [rules, shortestCall] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { lawyerId: profile.id },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
      select: { id: true, weekday: true, startMin: true, endMin: true },
    }),
    prisma.service.findFirst({
      where: {
        lawyerId: profile.id,
        active: true,
        type: { in: ["VIDEO", "AUDIO"] },
      },
      orderBy: { durationMin: "asc" },
      select: { durationMin: true },
    }),
  ]);

  const previewDuration = shortestCall?.durationMin ?? 30;

  const slots = generateSlots({
    rules,
    bufferMin: profile.bufferMin,
    durationMin: previewDuration,
    days: 7,
  });

  const byDay = new Map<string, { weekday: number; labels: string[] }>();
  for (const s of slots) {
    const entry = byDay.get(s.dateIso) ?? { weekday: s.weekday, labels: [] };
    entry.labels.push(s.label);
    byDay.set(s.dateIso, entry);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.availT")}</h1>
      <p className="mt-2 text-sm">
        {t("avail.subtitle")}
      </p>

      <AvailabilityManager
        settings={{
          bookingMode: profile.bookingMode,
          bufferMin: profile.bufferMin,
        }}
        rules={rules}
      />

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        {t("avail.preview", { d: previewDuration })}
      </h2>
      {byDay.size === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {t("avail.previewEmpty")}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {[...byDay.entries()].map(([dateIso, day]) => (
            <div key={dateIso} className="rounded border border-gray-200 p-3">
              <p className="text-sm font-medium text-navy">
                {t(`common.wd.${day.weekday}`)} · {dateIso}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {day.labels.map((l) => (
                  <span
                    key={l}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
