import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
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
                  <span className="text-white/80">
                    {user.fullName || user.phone}
                  </span>
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
      </body>
    </html>
  );
}
