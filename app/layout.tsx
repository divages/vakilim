import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/logout-button";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Vakilim.az — Vəkilinizi tapın",
  description:
    "Azərbaycanda yoxlanılmış vəkillər və hüquqşünaslarla onlayn məsləhət.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;
  return (
    <html lang="az">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <header className="bg-navy text-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Vakilim<span className="text-emerald">.az</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/lawyers" className="text-white/80 hover:text-white">
                Vəkillər
              </Link>
              <Link href="/templates" className="text-white/80 hover:text-white">
                Sənədlər
              </Link>
              {user?.role === "CLIENT" && (
                <Link href="/bookings" className="text-white/80 hover:text-white">
                  Görüşlərim
                </Link>
              )}
              {user?.role === "ADMIN" ? (
                <>
                  <Link
                    href="/admin/verifications"
                    className="text-white/80 hover:text-white"
                  >
                    Müraciətlər
                  </Link>
                  <Link
                    href="/admin/recordings"
                    className="text-white/80 hover:text-white"
                  >
                    Yazılar
                  </Link>
                  <Link
                    href="/admin/flags"
                    className="text-white/80 hover:text-white"
                  >
                    Moderasiya
                  </Link>
                  <Link
                    href="/admin/disputes"
                    className="text-white/80 hover:text-white"
                  >
                    Mübahisələr
                  </Link>
                  <Link
                    href="/admin/templates"
                    className="text-white/80 hover:text-white"
                  >
                    Şablonlar
                  </Link>
                </>
              ) : user?.role === "LAWYER" ? (
                <Link
                  href="/lawyer/dashboard"
                  className="text-white/80 hover:text-white"
                >
                  Vəkil paneli
                </Link>
              ) : (
                <Link
                  href="/lawyer/apply"
                  className="text-white/80 hover:text-white"
                >
                  Vəkillər üçün
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative text-white/80 hover:text-white"
                  >
                    🔔
                    {unread > 0 && (
                      <span className="absolute -right-2 -top-1 rounded-full bg-emerald px-1.5 text-[10px] font-bold text-navy-dark">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/settings"
                    className="text-white/80 hover:text-white"
                  >
                    {user.fullName || user.phone}
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded bg-emerald px-4 py-2 font-medium text-navy-dark hover:opacity-90"
                >
                  Daxil ol
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-sm">
            © {new Date().getFullYear()} Vakilim.az
          </div>
        </footer>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
