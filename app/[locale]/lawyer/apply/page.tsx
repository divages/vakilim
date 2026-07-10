import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ApplyForm from "./apply-form";
import { getTranslations } from "next-intl/server";

export default async function BecomeLawyerPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/apply");

  const existing = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
  });
  if (existing) redirect("/lawyer/dashboard");

  const areas = await prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameAz: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("apply.title")}</h1>
      <p className="mt-2 text-sm">
        {t("apply.subtitle")}
      </p>
      <ApplyForm areas={areas} defaultFullName={user.fullName ?? ""} />
    </div>
  );
}
