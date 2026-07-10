import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import TemplateForm from "./template-form";
import ToggleActive from "./toggle-active";
import { getTranslations } from "next-intl/server";

export default async function AdminTemplatesPage() {
  const tr = await getTranslations();
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const templates = await prisma.docTemplate.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: {
      versions: { orderBy: { version: "desc" }, take: 1, select: { version: true } },
      _count: { select: { versions: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{tr("catalog.title")}</h1>
      <p className="mt-2 text-sm">
        {tr("admT.subtitle")}
      </p>

      <div className="mt-6 space-y-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div>
              <p className="font-medium text-navy">
                {t.title}{" "}
                <span className="text-xs font-normal text-slate">
                  v{t.versions[0]?.version ?? 0} · {t._count.versions} versiya
                </span>
              </p>
              <p className="mt-1 text-xs text-slate">
                {t.slug} · {t.category} ·{" "}
                {t.priceQepik === 0 ? "Pulsuz" : formatAzn(t.priceQepik)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  t.active
                    ? "bg-emerald/15 text-navy"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.active ? "Aktiv" : "Deaktiv"}
              </span>
              <ToggleActive id={t.id} active={t.active} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        {tr("admT.formTitle")}
      </h2>
      <TemplateForm />
    </div>
  );
}
