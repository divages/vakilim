import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
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
      <h1 className="text-2xl font-bold text-navy">Bildirişlər</h1>

      {notifications.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Hələ bildiriş yoxdur.
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
                  <p className="text-sm font-medium text-navy">{n.title}</p>
                  <p className="mt-1 text-sm">{n.body}</p>
                </div>
                <p className="whitespace-nowrap text-xs text-slate">
                  {n.createdAt.toLocaleString("az-AZ", {
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
                  Bax
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
