import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { intlTag } from "@/lib/locale";

export default async function NotificationsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Opening the page marks everything as read (idempotent).
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("notif.title")}</h1>

      {notifications.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          {t("notif.empty")}
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded border p-4 ${
                n.readAt ? "border-gray-200" : "border-navy/40 bg-navy/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">{n.params ? t(`notifT.${n.type}.title`, n.params as Record<string, string | number>) : n.title}</p>
                  <p className="mt-1 text-sm">{n.params ? t(`notifT.${n.type}.body`, n.params as Record<string, string | number>) : n.body}</p>
                </div>
                <p className="whitespace-nowrap text-xs text-slate">
                  {n.createdAt.toLocaleString(intlTag(locale), {
                    timeZone: "Asia/Baku",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  className="mt-2 inline-block text-sm text-emerald underline"
                >
                  {t("common.view")}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
