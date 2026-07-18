"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ResetForm({ token }: { token: string }) {
  const t = useTranslations();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "INVALID_TOKEN"
            ? t("reset.errors.INVALID_TOKEN")
            : t("reset.errors.DEFAULT")
        );
        return;
      }
      setDone(true);
    } catch {
      setError(t("reset.errors.DEFAULT"));
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          {t("reset.doneT")}
        </h1>
        <p className="mt-3 text-slate">{t("reset.doneB")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-navy px-6 py-3 font-medium text-white"
        >
          {t("nav.login")}
        </Link>
      </div>
    );

  return (
    <form onSubmit={submit}>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("reset.newT")}
      </h1>
      <input
        type="password"
        autoComplete="new-password"
        autoFocus
        required
        minLength={8}
        placeholder={t("login2.password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald"
      />
      <p className="mt-1 text-xs text-slate">{t("signup.pwHint")}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("login2.checking") : t("reset.save")}
      </button>
    </form>
  );
}
