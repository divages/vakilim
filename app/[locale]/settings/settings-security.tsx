"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SettingsSecurity({
  email,
  emailVerified,
  hasPassword,
}: {
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
}) {
  const t = useTranslations();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hasPw, setHasPw] = useState(hasPassword);

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

      <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-slate">
        {t("sett2.googleSoon")}
      </p>
    </div>
  );
}
