"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** Resend button with a visible cooldown. The cooldown starts on mount
 *  (a code was just sent when this appears). Server rate limits remain
 *  the real guard; this is honesty in the UI. */
export default function ResendCode({
  onResend,
  seconds = 45,
}: {
  onResend: () => Promise<boolean>;
  seconds?: number;
}) {
  const t = useTranslations();
  const [left, setLeft] = useState(seconds);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  async function click() {
    if (busy || left > 0) return;
    setBusy(true);
    setFail(false);
    try {
      const ok = await onResend();
      if (ok) setLeft(seconds);
      else {
        setFail(true);
        setTimeout(() => setFail(false), 3000);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 text-center">
      <button
        type="button"
        onClick={click}
        disabled={busy || left > 0}
        className={`text-sm font-medium ${
          left > 0 ? "text-slate-400" : "text-emerald hover:underline"
        }`}
      >
        {left > 0
          ? t("otp.resendIn", { s: left })
          : busy
            ? t("otp.resending")
            : t("otp.resend")}
      </button>
      {fail && <p className="mt-1 text-xs text-red-600">{t("otp.resendFail")}</p>}
    </div>
  );
}
