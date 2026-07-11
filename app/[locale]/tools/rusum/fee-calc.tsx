"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** DRAFT (LAYIHE) — draft brackets for court property claims (physical persons).
 *  Verify every figure against the Law on State Duty on e-qanun.az
 *  BEFORE removing the noindex gate. Structure: fee = base + pct% of the
 *  amount exceeding `over`, capped at CAP. */
const BRACKETS = [
  { over: 0, base: 20, pct: 0 },
  { over: 500, base: 20, pct: 3 },
  { over: 5000, base: 155, pct: 2 },
  { over: 50000, base: 1055, pct: 1 },
] as const;
const CAP = 5000;

function fee(amount: number): number {
  let b: (typeof BRACKETS)[number] = BRACKETS[0];
  for (const x of BRACKETS) if (amount > x.over) b = x;
  const f = b.base + ((amount - b.over) * b.pct) / 100;
  return Math.min(Math.round(f * 100) / 100, CAP);
}

export default function FeeCalc() {
  const t = useTranslations();
  const [raw, setRaw] = useState("");
  const amount = parseFloat(raw.replace(",", "."));
  const ok = Number.isFinite(amount) && amount > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("tools.feeTitle")}
      </h1>
      <p className="mt-2 text-slate">{t("tools.feeSub")}</p>

      <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <span className="font-bold">{t("tools.draftTag")} · </span>
        {t("tools.draftBanner")}
      </div>

      <label className="mt-8 block text-xs font-semibold uppercase text-slate">
        {t("tools.amount")}
      </label>
      <div className="mt-1 flex items-center gap-3">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="decimal"
          placeholder="12000"
          className="w-full max-w-xs rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-emerald"
        />
        <span className="text-lg font-bold text-navy">₼</span>
      </div>

      {ok && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate">
            {t("tools.feeResultH")}
          </p>
          <p className="mt-1 text-4xl font-extrabold text-navy">
            ≈ {fee(amount).toFixed(2)} <span className="text-2xl">₼</span>
          </p>
          <p className="mt-2 text-xs text-slate">{t("tools.feeScope")}</p>
        </div>
      )}

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-slate">
        {t("tools.ratesH")}
      </h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-slate">
            <tr>
              <th className="px-4 py-2.5">{t("tools.rateFrom")}</th>
              <th className="px-4 py-2.5">{t("tools.rateRule")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {BRACKETS.map((b) => (
              <tr key={b.over}>
                <td className="px-4 py-2.5 text-slate">
                  {b.over.toLocaleString()} ₼ +
                </td>
                <td className="px-4 py-2.5 font-medium text-navy">
                  {b.base} ₼{b.pct > 0 ? ` + ${b.pct}%` : ""}
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2.5 text-slate">{t("tools.rateCap")}</td>
              <td className="px-4 py-2.5 font-medium text-navy">{CAP.toLocaleString()} ₼</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs text-slate">{t("tools.legalNote")}</p>
    </div>
  );
}
