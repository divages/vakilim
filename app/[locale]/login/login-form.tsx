"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function LoginForm({ next }: { next: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const ERRORS: Record<string, string> = {
    INVALID_PHONE: t("login.errors.INVALID_PHONE"),
    TOO_MANY_REQUESTS: t("login.errors.TOO_MANY_REQUESTS"),
    CODE_EXPIRED: t("login.errors.CODE_EXPIRED"),
    WRONG_CODE: t("login.errors.WRONG_CODE"),
    TOO_MANY_ATTEMPTS: t("login.errors.TOO_MANY_ATTEMPTS"),
    DEFAULT: t("login.errors.DEFAULT"),
  };
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      setStep("code");
      setCode("");
      setResendIn(30);
      setDevCode(data.devCode ?? null);
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.href = next;
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  if (step === "phone") {
    return (
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          requestCode();
        }}
      >
        <label htmlFor="phone" className="block text-sm font-medium text-navy">
          {t("login.phoneLabel")}
        </label>
        <div className="flex rounded border border-gray-300 focus-within:border-navy">
          <span className="flex items-center border-r border-gray-300 bg-gray-50 px-3">
            +994
          </span>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="50 123 45 67"
            inputMode="tel"
            autoFocus
            className="w-full rounded-r px-3 py-2 outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? t("login.sending") : t("login.sendCode")}
        </button>
      </form>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
    >
      <p className="text-sm">
        {t.rich("login.sentTo", { phone: () => <b className="text-navy">{phone}</b> })}
      </p>
      {devCode && (
        <p className="rounded border border-amber-200 bg-amber-50 p-2 text-center text-sm text-amber-800">
          {t("login.demoCode")} <b className="tracking-widest">{devCode}</b>
        </p>
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={t("login.codePh")}
        inputMode="numeric"
        autoFocus
        className="w-full rounded border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-navy"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={busy || code.length !== 6}
        className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? t("login.checking") : t("login.verify")}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
          }}
          className="text-slate underline"
        >
          {t("login.changeNumber")}
        </button>
        <button
          type="button"
          disabled={resendIn > 0 || busy}
          onClick={requestCode}
          className="text-emerald disabled:text-gray-400"
        >
          {resendIn > 0 ? t("login.resendIn", { s: resendIn }) : t("login.resend")}
        </button>
      </div>
    </form>
  );
}
