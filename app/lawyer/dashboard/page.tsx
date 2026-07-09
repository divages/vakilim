import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPE_LABELS: Record<string, string> = {
  ADVOCATE: "Vəkil (Kollegiya üzvü)",
  LICENSED_LAWYER: "Hüquqşünas",
};

const LANG_LABELS: Record<string, string> = {
  az: "Azərbaycan",
  ru: "Rus",
  en: "İngilis",
};

export default async function LawyerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/dashboard");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    include: { practiceAreas: { include: { practiceArea: true } } },
  });
  if (!profile) redirect("/lawyer/apply");

  const status = profile.verificationStatus;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Vəkil paneli</h1>

      {status === "PENDING" && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">Müraciətiniz baxılır</p>
          <p className="mt-1 text-sm text-amber-800">
            Sənədləriniz yoxlanılır. Təsdiqdən sonra profiliniz platformada
            görünəcək.
          </p>
        </div>
      )}

      {status === "APPROVED" && (
        <div className="mt-6 rounded border border-emerald/30 bg-emerald/10 p-4">
          <p className="font-medium text-navy">Profiliniz təsdiqlənib</p>
          <p className="mt-1 text-sm">
            Profiliniz platformada görünür. Tezliklə burada görüşlərinizi idarə
            edə biləcəksiniz.
          </p>
        </div>
      )}

      {status === "REJECTED" && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">Müraciət rədd edilib</p>
          <p className="mt-1 text-sm text-red-700">
            {profile.rejectionReason ??
              "Ətraflı məlumat üçün bizimlə əlaqə saxlayın."}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">Xidmətlər və qiymətlər</p>
          <p className="mt-1 text-sm">
            Görüş növlərinizi və qiymətlərinizi təyin edin.
          </p>
        </div>
        <Link
          href="/lawyer/services"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          İdarə et
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">Qrafik və mövcudluq</p>
          <p className="mt-1 text-sm">
            İş saatlarınızı təyin edin — boş slotlar avtomatik yaranır.
          </p>
        </div>
        <Link
          href="/lawyer/availability"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          İdarə et
        </Link>
      </div>

      <div className="mt-8 rounded border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-navy">
          Göndərilmiş məlumatlar
        </div>
        <dl className="divide-y divide-gray-100 text-sm">
          <Row label="Ad və soyad" value={user.fullName ?? "—"} />
          <Row label="Status" value={TYPE_LABELS[profile.type]} />
          <Row label="Lisenziya / vəsiqə №" value={profile.licenseNo ?? "—"} />
          <Row label="Şəhər" value={profile.city} />
          <Row
            label="Təcrübə"
            value={
              profile.yearsExperience !== null
                ? `${profile.yearsExperience} il`
                : "—"
            }
          />
          <Row
            label="Dillər"
            value={profile.languages.map((l) => LANG_LABELS[l] ?? l).join(", ")}
          />
          <Row
            label="Fəaliyyət sahələri"
            value={profile.practiceAreas
              .map((pa) => pa.practiceArea.nameAz)
              .join(", ")}
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
