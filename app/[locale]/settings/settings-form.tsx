"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SettingsForm({
  defaultFullName,
  defaultEmail,
  phone,
}: {
  defaultFullName: string;
  defaultEmail: string;
  phone: string;
}) {
  const [pStep, setPStep] = useState<"idle" | "input" | "code">("idle");
  const [pNew, setPNew] = useState("");
  const [pCode, setPCode] = useState("");
  const [pDev, setPDev] = useState<string | null>(null);
  const [pMsg, setPMsg] = useState<string | null>(null);
  async function phonePost(body: unknown) {
    const res = await fetch("/api/me/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && data?.ok, data };
  }
  async function phoneStart() {
    setPMsg(null);
    const { ok, data } = await phonePost({ action: "start", phone: pNew });
    if (!ok) {
      setPMsg(
        data?.error === "PHONE_TAKEN"
          ? t("signup.errors.PHONE_TAKEN")
          : data?.error === "INVALID_PHONE"
            ? t("login2.errors.INVALID_PHONE")
            : t("sett2.errors.DEFAULT")
      );
      return;
    }
    setPDev(data?.devCode ?? null);
    setPStep("code");
  }
  async function phoneConfirm() {
    setPMsg(null);
    const { ok, data } = await phonePost({ action: "confirm", phone: pNew, code: pCode });
    if (!ok) {
      setPMsg(data?.error === "WRONG_CODE" ? t("login2.errors.INVALID_CODE") : t("sett2.errors.DEFAULT"));
      return;
    }
    window.location.reload();
  }
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("sett.errors.UNAUTHORIZED"),
    EMAIL_TAKEN: t("sett.errors.EMAIL_TAKEN"),
    INVALID_BODY: t("sett.errors.INVALID_BODY"),
    DEFAULT: t("sett.errors.DEFAULT"),
  };
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      setSaved(true);
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy";

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div>
        <label className="block text-sm font-medium text-navy">{t("common.phone")}</label>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-sm font-medium text-navy">{phone || "—"}</span>
          {pStep === "idle" && (
            <button
              type="button"
              onClick={() => setPStep("input")}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy"
            >
              {t("sett2.phoneChange")}
            </button>
          )}
        </div>
        {pStep === "input" && (
          <div className="mt-2">
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+994 50 123 45 67"
              value={pNew}
              onChange={(e) => setPNew(e.target.value)}
              className={inputCls}
            />
            {pMsg && <p className="mt-2 text-sm text-red-600">{pMsg}</p>}
            <button
              type="button"
              onClick={phoneStart}
              className="mt-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t("login2.sendCode")}
            </button>
          </div>
        )}
        {pStep === "code" && (
          <div className="mt-2">
            {pDev && (
              <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                [DEV] <b>{pDev}</b>
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pCode}
              onChange={(e) => setPCode(e.target.value)}
              className={inputCls}
            />
            {pMsg && <p className="mt-2 text-sm text-red-600">{pMsg}</p>}
            <button
              type="button"
              onClick={phoneConfirm}
              className="mt-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t("cphone.confirm")}
            </button>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="fn" className="block text-sm font-medium text-navy">
          {t("apply.fullName")}
        </label>
        <input
          id="fn"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="em" className="block text-sm font-medium text-navy">
          {t("sett.email")}
        </label>
        <input
          id="em"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("sett.emailPh")}
          inputMode="email"
          className={inputCls}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald">{t("common.savedTick")}</p>}
      <button
        disabled={busy}
        className="w-full rounded-xl bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : t("sett.save")}
      </button>
    </form>
  );
}
