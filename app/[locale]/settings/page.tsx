import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsForm from "./settings-form";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Profil</h1>
      <p className="mt-2 text-sm">
        {t("sett.subtitle")}
      </p>
      <SettingsForm
        defaultFullName={user.fullName ?? ""}
        defaultEmail={user.email ?? ""}
        phone={user.phone ?? ""}
      />
    </div>
  );
}
