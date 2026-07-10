"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Avatar from "@/components/avatar";

type Lawyer = {
  id: string;
  slug: string | null;
  name: string;
  type: string;
  city: string;
  hasPhoto: boolean;
  minPriceQepik: number | null;
  ratingAvg: number | null;
  reviewCount: number;
};
type Result = {
  area: { slug: string; name: string } | null;
  summary: string;
  question: string;
  lawyers: Lawyer[];
};

export default function IntakeForm() {
  const t = useTranslations();
  const locale = useLocale();
  const ERRORS: Record<string, string> = {
    TOO_MANY_REQUESTS: t("intake.errors.TOO_MANY_REQUESTS"),
    INVALID_BODY: t("intake.errors.INVALID_BODY"),
    AI_UNAVAILABLE: t("intake.errors.AI_UNAVAILABLE"),
    DEFAULT: t("intake.errors.DEFAULT"),
  };
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || text.trim().length < 20) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), locale }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(ERRORS[data?.error] ?? ERRORS.DEFAULT);
        return;
      }
      setResult(data as Result);
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  async function copyQuestion() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.question);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="mt-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={1200}
          placeholder={t("intake.ph")}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate">{text.trim().length}/1200</span>
          <button
            disabled={busy || text.trim().length < 20}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {busy ? t("intake.analyzing") : t("intake.submit")}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 space-y-6">
          {result.area && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate">{t("intake.areaLabel")}</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                {result.area.name}
              </span>
            </div>
          )}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
            <p className="text-sm leading-relaxed text-slate-700">{result.summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate">{t("intake.questionLabel")}</p>
            <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="whitespace-pre-line text-sm leading-relaxed">{result.question}</p>
              <button
                onClick={copyQuestion}
                className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy hover:border-emerald hover:text-emerald"
              >
                {copied ? t("intake.copied") : t("intake.copy")}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate">{t("intake.lawyersLabel")}</p>
            {result.lawyers.length === 0 ? (
              <p className="mt-2 text-sm text-slate">
                {t("intake.none")}{" "}
                <Link href="/lawyers" className="font-medium text-emerald hover:underline">
                  {t("nav.lawyers")} →
                </Link>
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {result.lawyers.map((l) => (
                  <Link
                    key={l.id}
                    href={`/lawyers/${l.slug}`}
                    className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <Avatar name={l.name} profileId={l.id} hasPhoto={l.hasPhoto} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy">{l.name}</p>
                      <p className="text-sm text-slate">
                        {t(`common.lawyerType.${l.type}`)} · {l.city}
                        {l.ratingAvg !== null && (
                          <> · <span className="font-semibold text-emerald">★ {l.ratingAvg.toFixed(1)}</span></>
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
