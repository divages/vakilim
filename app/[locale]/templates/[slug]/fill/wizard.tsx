"use client";

import { useState } from "react";
import { displayValue, type FieldDef } from "@/lib/doc-fields";
import { useTranslations } from "next-intl";

export default function Wizard({
  slug,
  free,
  fields,
}: {
  slug: string;
  free: boolean;
  fields: FieldDef[];
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("wizard.errors.UNAUTHORIZED"),
    NOT_FOUND: t("wizard.errors.NOT_FOUND"),
    INVALID_FIELD: t("wizard.errors.INVALID_FIELD"),
    INVALID_BODY: t("wizard.errors.INVALID_BODY"),
    TOO_MANY_REQUESTS: t("wizard.errors.TOO_MANY_REQUESTS"),
    DEFAULT: t("wizard.errors.DEFAULT"),
  };
  const [step, setStep] = useState(0); // fields.length == review screen
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [license, setLicense] = useState(false);
  const [busy, setBusy] = useState(false);

  const onReview = step >= fields.length;
  const field = onReview ? null : fields[step];

  function localCheck(f: FieldDef): string | null {
    const v = (answers[f.key] ?? "").trim();
    if (f.required && !v) return t("wizard.reqField");
    if (v && f.type === "number" && !/^\d+([.,]\d+)?$/.test(v))
      return t("wizard.numOnly");
    return null;
  }

  function next() {
    if (field) {
      const err = localCheck(field);
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    setStep((s) => s + 1);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/doc-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug: slug, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INVALID_FIELD") {
          const idx = fields.findIndex((f) => f.key === data.fieldKey);
          if (idx >= 0) setStep(idx);
        }
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.href = data.free ? "/documents" : `/doc-pay/${data.id}`;
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy";

  if (!onReview && field) {
    return (
      <div className="mt-6">
        <p className="text-xs text-slate">
          {t("wizard.progress", { i: step + 1, n: fields.length })}
        </p>
        <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
          <div
            className="h-1 rounded-xl bg-emerald"
            style={{ width: `${(step / fields.length) * 100}%` }}
          />
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <label className="block text-base font-medium text-navy">
            {field.labelAz}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          {field.helpAz && (
            <p className="mt-1 text-sm text-slate">{field.helpAz}</p>
          )}

          {field.type === "textarea" ? (
            <textarea
              rows={5}
              autoFocus
              value={answers[field.key] ?? ""}
              onChange={(e) =>
                setAnswers({ ...answers, [field.key]: e.target.value })
              }
              className={inputCls}
            />
          ) : field.type === "select" ? (
            <select
              autoFocus
              value={answers[field.key] ?? ""}
              onChange={(e) =>
                setAnswers({ ...answers, [field.key]: e.target.value })
              }
              className={inputCls}
            >
              <option value="">{t("wizard.select")}</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.labelAz}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "date" ? "date" : "text"}
              inputMode={field.type === "number" ? "decimal" : undefined}
              autoFocus
              value={answers[field.key] ?? ""}
              onChange={(e) =>
                setAnswers({ ...answers, [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              className={inputCls}
            />
          )}

          {stepError && (
            <p className="mt-2 text-sm text-red-600">{stepError}</p>
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStepError(null);
                  setStep((s) => s - 1);
                }}
                className="rounded-xl border border-gray-100 px-4 py-2.5 text-sm font-medium text-navy hover:border-navy"
              >
                {t("wizard.back")}
              </button>
            )}
            <button className="flex-1 rounded-xl bg-navy py-2.5 font-medium text-white hover:bg-navy-dark">
              {step === fields.length - 1 ? t("wizard.toReview") : t("wizard.next")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate">
        {t("wizard.reviewTitle")}
      </h2>
      <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100 shadow-sm text-sm">
        {fields.map((f, i) => (
          <div key={f.key} className="flex items-start justify-between gap-3 px-3 py-2">
            <dt className="text-slate">{f.labelAz}</dt>
            <dd className="flex items-center gap-2 text-right font-medium text-navy">
              {displayValue(f, answers[f.key] ?? "")}
              <button
                type="button"
                onClick={() => setStep(i)}
                className="text-xs text-emerald underline"
              >
                {t("wizard.change")}
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed">
        <input
          type="checkbox"
          checked={license}
          onChange={(e) => setLicense(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {t("wizard.license")}
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!license || busy}
        className="mt-4 w-full rounded-xl bg-navy py-3 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? t("wizard.busy") : free ? t("wizard.submitFree") : t("wizard.submitPaid")}
      </button>
    </div>
  );
}
