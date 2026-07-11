import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PostsEditor from "./posts-editor";

export default async function AdminPostsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/");
  const t = await getTranslations();
  const areas = await // unbounded-ok: naturally bounded set
  prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAz: true },
  });
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("admP.title")}
      </h1>
      <PostsEditor
        areas={areas}
        posts={posts.map((p) => ({
          id: p.id,
          kind: p.kind,
          slug: p.slug,
          titleAz: p.titleAz,
          titleRu: p.titleRu,
          titleEn: p.titleEn,
          excerptAz: p.excerptAz,
          excerptRu: p.excerptRu,
          excerptEn: p.excerptEn,
          bodyAz: p.bodyAz,
          bodyRu: p.bodyRu,
          bodyEn: p.bodyEn,
          coverUrl: p.coverUrl,
          authorName: p.authorName,
          practiceAreaSlug: p.practiceAreaSlug,
          published: !!p.publishedAt,
        }))}
      />
    </div>
  );
}
