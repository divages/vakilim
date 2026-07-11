"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ResendCode from "@/components/resend-code";

export default function CompletePhoneForm({ next }: { next: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ERR = (k: string) =>
    t.has(`login2.errors.${k}` as never)
      ? t(`login2.errors.${k}` as never)
      : k === "PHONE_TAKEN"
        ? t("signup.errors.PHONE_TAKEN")
        : t("login2.errors.DEFAULT");

  async function post(body: unknown) {
    const res = await fetch("/api/me/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && data?.ok, data };
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post({ action: "start", phone });
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

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post({ action: "confirm", phone, code });
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

  async function resendCode() {
    const { ok, data } = await post({ action: "start", phone });
    if (ok) setDevCode(data?.devCode ?? null);
    return ok;
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald";

  return step === "phone" ? (
    <form onSubmit={start} className="mt-5">
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
    </form>
  ) : (
    <form onSubmit={confirm} className="mt-5">
      <p className="text-sm text-slate">{t("login2.codeSent", { phone })}</p>
      {devCode && (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          [DEV] <b>{devCode}</b>
        </p>
      )}
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
        {busy ? t("login2.checking") : t("cphone.confirm")}
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setStep("phone");
        }}
        className="mt-3 w-full text-sm font-medium text-emerald hover:underline"
      >
        ← {t("login2.changePhone")}
      </button>
    <ResendCode onResend={resendCode} />
      </form>
  );
}
