"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Mode = "email" | "phone-request" | "phone-verify";

export default function LoginForm({
  next,
  verifyFailed = false,
}: {
  next: string;
  verifyFailed?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const ERR = (k: string) =>
    t.has(`login2.errors.${k}` as never)
      ? t(`login2.errors.${k}` as never)
      : t("login2.errors.DEFAULT");

  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && data?.ok, data };
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        locale,
      });
      if (!ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/request-code", {
        phone,
        locale,
      });
      if (!ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      setDevCode(data?.devCode ?? null);
      setMode("phone-verify");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/verify", {
        phone,
        code,
        locale,
      });
      if (!ok) {
        setError(ERR(data?.error ?? "DEFAULT"));
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald";
  const labelCls = "mt-4 block text-xs font-semibold uppercase text-slate";

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("login2.title")}
      </h1>
      {verifyFailed && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("login2.verifyFailed")}
        </p>
      )}

      {process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1" && (
        <>
          <a
            href={`/api/auth/google?next=${encodeURIComponent(next)}`}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-navy hover:border-navy"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            {t("login2.google")}
          </a>
          <div className="mt-5 flex items-center gap-3 text-xs text-slate">
            <span className="h-px flex-1 bg-gray-100" />
            {t("login2.or")}
            <span className="h-px flex-1 bg-gray-100" />
          </div>
        </>
      )}

      {mode === "email" && (
        <form onSubmit={submitEmail} className="mt-4">
          <label className={labelCls}>{t("login2.email")}</label>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <label className={labelCls}>{t("login2.password")}</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate"
              aria-label={t("login2.showPw")}
            >
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link href="/forgot" className="text-xs font-medium text-emerald hover:underline">
              {t("login2.forgot")}
            </Link>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t("login2.checking") : t("login2.submit")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("phone-request");
            }}
            className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-navy hover:border-navy"
          >
            {t("login2.usePhone")}
          </button>
          <p className="mt-6 text-center text-sm text-slate">
            {t("login2.noAccount")}{" "}
            <Link href="/signup" className="font-semibold text-emerald hover:underline">
              {t("login2.signup")}
            </Link>
          </p>
        </form>
      )}

      {mode === "phone-request" && (
        <form onSubmit={requestCode} className="mt-4">
          <label className={labelCls}>{t("login2.phone")}</label>
          <input
            type="tel"
            autoComplete="tel"
            autoFocus
            required
            placeholder="+994 50 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate">{t("login2.phoneHint")}</p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t("login2.sending") : t("login2.sendCode")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("email");
            }}
            className="mt-3 w-full text-sm font-medium text-emerald hover:underline"
          >
            ← {t("login2.useEmail")}
          </button>
        </form>
      )}

      {mode === "phone-verify" && (
        <form onSubmit={verifyCode} className="mt-4">
          <p className="text-sm text-slate">{t("login2.codeSent", { phone })}</p>
          {devCode && (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("login.devCode")}: <b>{devCode}</b>
            </p>
          )}
          <label className={labelCls}>{t("login2.code")}</label>
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
            className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t("login.checking") : t("login.verify")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCode("");
              setMode("phone-request");
            }}
            className="mt-3 w-full text-sm font-medium text-emerald hover:underline"
          >
            ← {t("login2.changePhone")}
          </button>
        </form>
      )}
    </div>
  );
}
