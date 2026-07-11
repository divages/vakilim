import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import QaEditor from "./qa-editor";

export default async function AdminQaPage() {
  const t = await getTranslations();
  const areas = await prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAz: true },
  });
  const rows = await prisma.qaEntry.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 300,
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("admQ.title")}
      </h1>
      <QaEditor
        areas={areas}
        rows={rows.map((r) => ({
          ...r,
          published: !!r.publishedAt,
          createdAt: undefined,
          updatedAt: undefined,
          publishedAt: undefined,
        })) as never}
      />
    </div>
  );
}
