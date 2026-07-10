import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/logout-button";
import LanguageSwitcher from "@/components/language-switcher";
import LocaleSync from "@/components/locale-sync";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"] });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL("https://vakilim.az"),
    title: t("siteTitle"),
    description: t("siteDesc"),
    alternates: {
      canonical: `/${locale}`,
      languages: { az: "/az", ru: "/ru", en: "/en", "x-default": "/az" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations("nav");
  const tf = await getTranslations("footer");

  const user = await getCurrentUser();
  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;

  return (
    <html lang={locale}>
      <body className={`${inter.className} flex min-h-screen flex-col`} suppressHydrationWarning>
        <LocaleSync locale={locale} loggedIn={!!user} />
        <NextIntlClientProvider>
          <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
              <Link href="/" className="text-xl font-bold tracking-tight text-navy">
                Vakilim<span className="text-emerald">.az</span>
              </Link>
              <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
                <Link href="/lawyers" className="font-medium text-slate-600 hover:text-navy">
                  {t("lawyers")}
                </Link>
                <Link href="/templates" className="font-medium text-slate-600 hover:text-navy">
                  {t("documents")}
                </Link>
                {user?.role === "CLIENT" && (
                  <Link href="/bookings" className="font-medium text-slate-600 hover:text-navy">
                    {t("myBookings")}
                  </Link>
                )}
                {user?.role === "ADMIN" ? (
                  <>
                    <Link href="/admin/verifications" className="font-medium text-slate-600 hover:text-navy">
                      {t("admVer")}
                    </Link>
                    <Link href="/admin/recordings" className="font-medium text-slate-600 hover:text-navy">
                      {t("admRec")}
                    </Link>
                    <Link href="/admin/flags" className="font-medium text-slate-600 hover:text-navy">
                      {t("admFlags")}
                    </Link>
                    <Link href="/admin/disputes" className="font-medium text-slate-600 hover:text-navy">
                      {t("admDisp")}
                    </Link>
                    <Link href="/admin/templates" className="font-medium text-slate-600 hover:text-navy">
                      {t("admTpl")}
                    </Link>
                    <Link href="/admin/reviews" className="font-medium text-slate-600 hover:text-navy">
                      {t("admRev")}
                    </Link>
                  </>
                ) : user?.role === "LAWYER" ? (
                  <Link href="/lawyer/dashboard" className="font-medium text-slate-600 hover:text-navy">
                    {t("lawyerPanel")}
                  </Link>
                ) : (
                  <Link href="/lawyer/apply" className="font-medium text-slate-600 hover:text-navy">
                    {t("forLawyers")}
                  </Link>
                )}
                {user ? (
                  <>
                    <Link
                      href="/notifications"
                      className="relative font-medium text-slate-600 hover:text-navy"
                    >
                      🔔
                      {unread > 0 && (
                        <span className="absolute -right-2 -top-1 rounded-full bg-emerald px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <Link href="/settings" className="font-medium text-slate-600 hover:text-navy">
                      {user.fullName || user.phone}
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-navy px-5 py-2 font-medium text-white hover:opacity-90"
                  >
                    {t("login")}
                  </Link>
                )}
                <LanguageSwitcher />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-100 bg-gray-50">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
              <span>© {new Date().getFullYear()} Vakilim.az</span>
              <span className="flex gap-4">
                <Link href="/terms" className="text-slate hover:text-navy">
                  {tf("terms")}
                </Link>
                <Link href="/privacy" className="text-slate hover:text-navy">
                  {tf("privacy")}
                </Link>
                <Link href="/refund-policy" className="text-slate hover:text-navy">
                  {tf("refund")}
                </Link>
              </span>
            </div>
          </footer>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
