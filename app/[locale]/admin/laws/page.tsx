import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import LawsEditor from "./laws-editor";

export default async function AdminLawsPage() {
  const t = await getTranslations();
  const rows = await prisma.lawDoc.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    take: 300,
    select: {
      id: true, kind: true, slug: true, sortOrder: true,
      titleAz: true, titleRu: true, titleEn: true,
      bodyAz: true, bodyRu: true, bodyEn: true,
      publishedAt: true,
    },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("admL.title")}
      </h1>
      <LawsEditor
        rows={rows.map((r) => ({ ...r, published: !!r.publishedAt, publishedAt: undefined })) as never}
      />
    </div>
  );
}
