"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SignupForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [step, setStep] = useState<"details" | "code" | "done">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const ERR = (k: string) =>
    t.has(`signup.errors.${k}` as never)
      ? t(`signup.errors.${k}` as never)
      : t.has(`login2.errors.${k}` as never)
        ? t(`login2.errors.${k}` as never)
        : t("signup.errors.DEFAULT");

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && data?.ok, data };
  }

  const details = () => ({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
    locale,
  });

  async function startSignup(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !agree) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/signup-start", details());
      if (!ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      setDevCode(data?.devCode ?? null);
      setStep("code");
    } finally {
      setBusy(false);
    }
  }

  async function completeSignup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/signup-complete", {
        ...details(),
        code,
      });
      if (!ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      setDevLink(data?.devLink ?? null);
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald";
  const labelCls = "mt-4 block text-xs font-semibold uppercase text-slate";

  if (step === "done")
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

  if (step === "code")
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          {t("signup.step2T")}
        </h1>
        <p className="mt-2 text-sm text-slate">
          {t("login2.codeSent", { phone })}
        </p>
        {devCode && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            [DEV] <b>{devCode}</b>
          </p>
        )}
        <form onSubmit={completeSignup} className="mt-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputCls}
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold text-white shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {busy ? t("login2.checking") : t("cphone.confirm")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCode("");
              setStep("details");
            }}
            className="mt-3 w-full text-sm font-medium text-emerald hover:underline"
          >
            ← {t("signup.editDetails")}
          </button>
        </form>
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
          {process.env.NEXT_PUBLIC_APPLE_LOGIN === "1" && (
            <a
              href="/api/auth/apple?next=/"
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
               {t("login2.apple")}
            </a>
          )}
          <div className="mt-5 flex items-center gap-3 text-xs text-slate">
            <span className="h-px flex-1 bg-gray-100" />
            {t("login2.or")}
            <span className="h-px flex-1 bg-gray-100" />
          </div>
        </>
      )}

      <form onSubmit={startSignup} className="mt-2">
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
        <label className={labelCls}>{t("signup.phone")}</label>
        <input
          type="tel"
          autoComplete="tel"
          required
          placeholder="+994 50 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-slate">{t("signup.phoneReq")}</p>
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
          {busy ? t("login2.sending") : t("signup.submit")}
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
