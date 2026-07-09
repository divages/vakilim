import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ApplyForm from "./apply-form";

export default async function BecomeLawyerPage() {
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
      <h1 className="text-2xl font-bold text-navy">Vəkil kimi qoşulun</h1>
      <p className="mt-2 text-sm">
        Məlumatlarınız yoxlanıldıqdan sonra profiliniz platformada görünəcək.
      </p>
      <ApplyForm areas={areas} defaultFullName={user.fullName ?? ""} />
    </div>
  );
}
