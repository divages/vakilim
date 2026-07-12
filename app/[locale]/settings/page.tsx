import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsForm from "./settings-form";
import { getTranslations } from "next-intl/server";
import SettingsSecurity from "./settings-security";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-navy">Profil</h1>
      <p className="mt-2 text-sm">
        {t("sett.subtitle")}
      </p>
      <SettingsForm
        defaultFullName={user.fullName ?? ""}
        defaultEmail={user.email ?? ""}
        phone={user.phone ?? ""}
      />
      {/* google link state */}
      <SettingsSecurity
        email={user.email}
        emailVerified={!!user.emailVerifiedAt}
        hasPassword={!!user.passwordHash}
        twoFactorEnabled={user.twoFactorEnabled}
        phone={user.phone}
        hasGoogle={
          (await prisma.account.count({
            where: { userId: user.id, provider: "google" },
          })) > 0
        }
      />
    </div>
  );
}
