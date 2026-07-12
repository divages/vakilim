import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { publishedPosts, pick } from "@/lib/posts";
import type { PostKind } from "@/generated/prisma/client";

export default async function PostList({
  kind,
  locale,
  page,
}: {
  kind: PostKind;
  locale: string;
  page: number;
}) {
  const t = await getTranslations();
  const base = kind === "BLOG" ? "/blog" : "/news";
  const { rows, pages } = await publishedPosts(kind, page);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t(kind === "BLOG" ? "blog.title" : "blog.newsTitle")}
      </h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-slate">{t("blog.empty")}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`${base}/${p.slug}`}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >
              {p.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverUrl}
                  alt=""
                  className="h-44 w-full object-cover"
                />
              )}
              <div className="p-5">
                <p className="text-xs text-slate">
                  {p.publishedAt!.toISOString().slice(0, 10)}
                  {p.authorName ? ` · ${p.authorName}` : ""}
                </p>
                <h2 className="mt-1 font-bold text-navy">
                  {pick(p, "title", locale)}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate">
                  {pick(p, "excerpt", locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {page < pages && (
        <div className="mt-8 text-center">
          <Link
            href={`${base}?page=${page + 1}`}
            className="inline-block rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-navy hover:border-navy"
          >
            {t("common.more")}
          </Link>
        </div>
      )}
    </div>
  );
}
