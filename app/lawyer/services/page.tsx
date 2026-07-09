import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServicesManager from "./services-manager";

export default async function LawyerServicesPage() {
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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Xidmətlər və qiymətlər</h1>
      <p className="mt-2 text-sm">
        Burada təyin etdiyiniz aktiv xidmətlər ictimai profilinizdə görünür.
      </p>
      <ServicesManager services={services} />
    </div>
  );
}
