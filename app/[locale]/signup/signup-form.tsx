"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SignupForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const ERR = (k: string) =>
    t.has(`signup.errors.${k}` as never)
      ? t(`signup.errors.${k}` as never)
      : t("signup.errors.DEFAULT");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !agree) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          locale,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      setDevLink(data?.devLink ?? null);
      setDone(true);
    } catch {
      setError(ERR("DEFAULT"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald";
  const labelCls = "mt-4 block text-xs font-semibold uppercase text-slate";

  if (done)
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          {t("signup.doneT")}
        </h1>
        <p className="mt-4 text-slate">{t("signup.doneB", { email })}</p>
        {devLink && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            [DEV] <a className="underline" href={devLink}>{devLink}</a>
          </p>
        )}
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("signup.title")}
      </h1>
      <p className="mt-2 text-sm text-slate">{t("signup.subtitle")}</p>

      {process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1" && (
        <>
          <a
            href="/api/auth/google?next=/"
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-navy hover:border-navy"
          >
            {t("signup.google")}
          </a>
          <div className="mt-5 flex items-center gap-3 text-xs text-slate">
            <span className="h-px flex-1 bg-gray-100" />
            {t("login2.or")}
            <span className="h-px flex-1 bg-gray-100" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="mt-2">
        <label className={labelCls}>{t("signup.name")}</label>
        <input
          autoComplete="name"
          autoFocus
          required
          minLength={2}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputCls}
        />
        <label className={labelCls}>{t("login2.email")}</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <label className={labelCls}>{t("login2.password")}</label>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-slate">{t("signup.pwHint")}</p>
        <label className={labelCls}>
          {t("signup.phone")}{" "}
          <span className="normal-case text-slate">({t("signup.optional")})</span>
        </label>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+994 50 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
        />
        <label className="mt-5 flex items-start gap-2 text-sm text-slate">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            {t("signup.agree")}{" "}
            <Link href="/terms" className="font-medium text-emerald hover:underline">
              {t("footer.terms")}
            </Link>
          </span>
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          disabled={busy || !agree}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold text-white shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          {busy ? t("signup.creating") : t("signup.submit")}
        </button>
        <p className="mt-6 text-center text-sm text-slate">
          {t("signup.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-emerald hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </form>
    </div>
  );
}
