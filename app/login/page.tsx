import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Daxil ol</h1>
      <p className="mt-2 text-sm">
        Telefon nömrənizi daxil edin — SMS ilə təsdiq kodu göndərəcəyik.
      </p>
      <LoginForm />
    </div>
  );
}
