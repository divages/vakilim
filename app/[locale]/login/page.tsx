import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

function safePath(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safePath(next);

  const user = await getCurrentUser();
  if (user) redirect(target);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Daxil ol</h1>
      <p className="mt-2 text-sm">
        Telefon nömrənizi daxil edin — SMS ilə təsdiq kodu göndərəcəyik.
      </p>
      <LoginForm next={target} />
    </div>
  );
}
