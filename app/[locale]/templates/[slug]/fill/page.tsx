import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FieldDef } from "@/lib/doc-fields";
import Wizard from "./wizard";

export default async function FillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/templates/${slug}/fill`);

  const template = await prisma.docTemplate.findFirst({
    where: { slug, active: true },
    include: {
      versions: {
        where: { published: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
  const version = template?.versions[0];
  if (!template || !version) notFound();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-xl font-bold text-navy">{template.title}</h1>
      <Wizard
        slug={template.slug}
        free={template.priceQepik === 0}
        fields={version.fields as unknown as FieldDef[]}
      />
    </div>
  );
}
