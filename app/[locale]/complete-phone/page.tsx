import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import CompletePhoneForm from "./complete-phone-form";

export default async function CompletePhonePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const nextRaw = sp.next ?? "/";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  if (user.phone) redirect(next);
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">
        {t("cphone.title")}
      </h1>
      <p className="mt-2 text-sm text-slate">{t("cphone.subtitle")}</p>
      <CompletePhoneForm next={next} />
    </div>
  );
}
