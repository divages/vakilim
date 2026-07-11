"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ResendCode from "@/components/resend-code";

export default function SettingsSecurity({
  email,
  emailVerified,
  hasPassword,
  hasGoogle,
  twoFactorEnabled,
  phone,
}: {
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  twoFactorEnabled: boolean;
  phone: string | null;
}) {
  const t = useTranslations();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hasPw, setHasPw] = useState(hasPassword);
  const [tfa, setTfa] = useState(twoFactorEnabled);
  const [tfaStep, setTfaStep] = useState<"idle" | "code">("idle");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaPw, setTfaPw] = useState("");
  const [tfaDev, setTfaDev] = useState<string | null>(null);
  const [tfaMsg, setTfaMsg] = useState<string | null>(null);

  async function tfaPost(body: unknown) {
    const res = await fetch("/api/me/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && data?.ok, data };
  }
  async function tfaStart() {
    setTfaMsg(null);
    const { ok, data } = await tfaPost({ action: "start" });
    if (!ok) { setTfaMsg(t("sett2.errors.DEFAULT")); return; }
    setTfaDev(data?.devCode ?? null);
    setTfaStep("code");
  }
  async function tfaEnable(e: React.FormEvent) {
    e.preventDefault();
    setTfaMsg(null);
    const { ok, data } = await tfaPost({ action: "enable", code: tfaCode });
    if (!ok) {
      setTfaMsg(data?.error === "WRONG_CODE" ? t("login2.errors.INVALID_CODE") : t("sett2.errors.DEFAULT"));
      return;
    }
    setTfa(true); setTfaStep("idle"); setTfaCode("");
  }
  async function tfaResend() {
    const { ok, data } = await tfaPost({ action: "start" });
    if (ok) setTfaDev(data?.devCode ?? null);
    return ok;
  }
  async function tfaDisable(e: React.FormEvent) {
    e.preventDefault();
    setTfaMsg(null);
    const { ok, data } = await tfaPost({ action: "disable", password: tfaPw || undefined });
    if (!ok) {
      setTfaMsg(data?.error === "WRONG_PASSWORD" ? t("sett2.errors.WRONG_PASSWORD") : t("sett2.errors.DEFAULT"));
      return;
    }
    setTfa(false); setTfaPw("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: current || undefined, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg({
          ok: false,
          text:
            data?.error === "WRONG_PASSWORD"
              ? t("sett2.errors.WRONG_PASSWORD")
              : t("sett2.errors.DEFAULT"),
        });
        return;
      }
      setMsg({ ok: true, text: t("sett2.saved") });
      setHasPw(true);
      setCurrent("");
      setPassword("");
    } catch {
      setMsg({ ok: false, text: t("sett2.errors.DEFAULT") });
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald";
  const labelCls = "mt-3 block text-xs font-semibold uppercase text-slate";

  return (
    <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-navy">{t("sett2.title")}</h2>

      <p className="mt-3 text-sm text-slate">
        {t("sett2.email")}:{" "}
        {email ? (
          <>
            <b className="text-navy">{email}</b>{" "}
            {emailVerified ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {t("sett2.verified")} ✓
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {t("sett2.unverified")}
              </span>
            )}
          </>
        ) : (
          <span className="text-slate">—</span>
        )}
      </p>

      <form onSubmit={submit} className="mt-4">
        <p className="text-sm font-medium text-navy">
          {hasPw ? t("sett2.pwChange") : t("sett2.pwSet")}
        </p>
        {hasPw && (
          <>
            <label className={labelCls}>{t("sett2.current")}</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputCls}
            />
          </>
        )}
        <label className={labelCls}>{t("sett2.newPw")}</label>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        {msg && (
          <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
        <button
          disabled={busy}
          className="mt-4 rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("login2.checking") : t("sett2.save")}
        </button>
      </form>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-navy">
          {t("sett2.tfaTitle")}{" "}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tfa ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-slate-600"}`}>
            {tfa ? t("sett2.tfaOn") : t("sett2.tfaOff")}
          </span>
        </p>
        {!phone ? (
          <p className="mt-2 text-sm text-slate">{t("sett2.tfaNoPhone")}</p>
        ) : tfa ? (
          <form onSubmit={tfaDisable} className="mt-2">
            {hasPw && (
              <input
                type="password"
                autoComplete="current-password"
                required
                placeholder={t("sett2.current")}
                value={tfaPw}
                onChange={(e) => setTfaPw(e.target.value)}
                className="mt-1 w-full max-w-xs rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald"
              />
            )}
            {tfaMsg && <p className="mt-2 text-sm text-red-600">{tfaMsg}</p>}
            <button className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy hover:border-navy">
              {t("sett2.tfaDisable")}
            </button>
          </form>
        ) : tfaStep === "idle" ? (
          <>
            {tfaMsg && <p className="mt-2 text-sm text-red-600">{tfaMsg}</p>}
            <button
              onClick={tfaStart}
              className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
            >
              {t("sett2.tfaEnable")}
            </button>
          </>
        ) : (
          <form onSubmit={tfaEnable} className="mt-2">
            <p className="text-sm text-slate">{t("sett2.tfaCodeSent")}</p>
            {tfaDev && (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                [DEV] <b>{tfaDev}</b>
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value)}
              className="mt-2 w-full max-w-xs rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald"
            />
            {tfaMsg && <p className="mt-2 text-sm text-red-600">{tfaMsg}</p>}
            <button className="mt-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {t("sett2.tfaConfirm")}
            </button>
            <ResendCode onResend={tfaResend} />
          </form>
        )}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        {hasGoogle ? (
          <p className="text-sm text-slate">
            Google:{" "}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {t("sett2.googleLinked")} ✓
            </span>
          </p>
        ) : process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1" ? (
          <a
            href="/api/auth/google?next=/az/settings"
            className="inline-block rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
          >
            {t("sett2.googleLink")}
          </a>
        ) : (
          <p className="text-sm text-slate">{t("sett2.googleSoon")}</p>
        )}
      </div>
    </div>
  );
}
