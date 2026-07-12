import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ArticlesEditor from "./articles-editor";

export default async function LawyerArticlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });
  if (profile?.verificationStatus !== "APPROVED") redirect("/lawyer/dashboard");
  const t = await getTranslations();
  const [rows, areas] = await Promise.all([
    prisma.post.findMany({
      where: { authorLawyerId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    // unbounded-ok: naturally bounded set
    prisma.practiceArea.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameAz: true },
    }),
  ]);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("lart.title")}
      </h1>
      <p className="mt-2 text-slate">{t("lart.subtitle")}</p>
      <ArticlesEditor
        areas={areas}
        rows={rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          titleAz: r.titleAz,
          titleRu: r.titleRu,
          titleEn: r.titleEn,
          excerptAz: r.excerptAz,
          excerptRu: r.excerptRu,
          excerptEn: r.excerptEn,
          bodyAz: r.bodyAz,
          bodyRu: r.bodyRu,
          bodyEn: r.bodyEn,
          practiceAreaSlug: r.practiceAreaSlug,
          published: !!r.publishedAt,
        }))}
      />
    </div>
  );
}
