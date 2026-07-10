"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function ForgotForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), locale }),
      });
      const data = await res.json().catch(() => null);
      setDevLink(data?.devLink ?? null);
      setSent(true); // always — no account enumeration
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          {t("reset.sentT")}
        </h1>
        <p className="mt-3 text-slate">{t("reset.sentB")}</p>
        {devLink && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            [DEV] <a className="underline" href={devLink}>{devLink}</a>
          </p>
        )}
      </div>
    );

  return (
    <form onSubmit={submit}>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">
        {t("reset.title")}
      </h1>
      <p className="mt-2 text-sm text-slate">{t("reset.subtitle")}</p>
      <input
        type="email"
        autoComplete="email"
        autoFocus
        required
        placeholder={t("login2.email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald"
      />
      <button
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("login2.sending") : t("reset.send")}
      </button>
    </form>
  );
}
