import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServicesManager from "./services-manager";
import { getTranslations } from "next-intl/server";

export default async function LawyerServicesPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/services");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const services = await prisma.service.findMany({
    where: { lawyerId: profile.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      durationMin: true,
      priceQepik: true,
      active: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("dash.svcT")}</h1>
      <p className="mt-2 text-sm">
        {t("svc.subtitle")}
      </p>
      <ServicesManager services={services} />
    </div>
  );
}
