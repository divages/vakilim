import { getTranslations } from "next-intl/server";
import SignupForm from "./signup-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("signupTitle"),
    alternates: {
      canonical: `/${locale}/signup`,
      languages: { az: "/az/signup", ru: "/ru/signup", en: "/en/signup", "x-default": "/az/signup" },
    },
  };
}

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <SignupForm />
    </div>
  );
}
