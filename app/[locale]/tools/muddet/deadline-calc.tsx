"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** DRAFT (LAYIHE) — draft appeal periods. Verify against the procedural codes on
 *  e-qanun.az BEFORE removing the noindex gate. Months are calendar months
 *  (same day next month; if absent, the month's last day). */
const PERIODS = {
  civil: { first: 1, appeal: 2 },
  admin: { first: 1, appeal: 1 },
} as const;

function addMonths(d: Date, months: number): Date {
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return target;
}
function shiftWeekend(d: Date): { date: Date; shifted: boolean } {
  const out = new Date(d);
  let shifted = false;
  while (out.getDay() === 0 || out.getDay() === 6) {
    out.setDate(out.getDate() + 1);
    shifted = true;
  }
  return { date: out, shifted };
}
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function DeadlineCalc() {
  const t = useTranslations();
  const [dateStr, setDateStr] = useState("");
  const [caseType, setCaseType] = useState<"civil" | "admin">("civil");
  const [stage, setStage] = useState<"first" | "appeal">("first");

  const base = dateStr ? new Date(`${dateStr}T12:00:00`) : null;
  const ok = base && !Number.isNaN(base.getTime());
  let deadline: Date | null = null;
  let shifted = false;
  let daysLeft: number | null = null;
  if (ok) {
    const raw = addMonths(base!, PERIODS[caseType][stage]);
    const s = shiftWeekend(raw);
    deadline = s.date;
    shifted = s.shifted;
    daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  }

  const seg = (active: boolean) =>
    `rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
      active ? "border-emerald bg-emerald-50/60 text-emerald-700" : "border-gray-200 text-slate-600 hover:border-gray-300"
    }`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("tools.dlTitle")}
      </h1>
      <p className="mt-2 text-slate">{t("tools.dlSub")}</p>

      <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <span className="font-bold">{t("tools.draftTag")} · </span>
        {t("tools.draftBanner")}
      </div>

      <label className="mt-8 block text-xs font-semibold uppercase text-slate">
        {t("tools.dlDate")}
      </label>
      <input
        type="date"
        value={dateStr}
        onChange={(e) => setDateStr(e.target.value)}
        className="mt-1 rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-emerald"
      />

      <p className="mt-5 text-xs font-semibold uppercase text-slate">{t("tools.dlCase")}</p>
      <div className="mt-1 flex gap-3">
        <button type="button" onClick={() => setCaseType("civil")} className={seg(caseType === "civil")}>
          {t("tools.dlCivil")}
        </button>
        <button type="button" onClick={() => setCaseType("admin")} className={seg(caseType === "admin")}>
          {t("tools.dlAdmin")}
        </button>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase text-slate">{t("tools.dlStage")}</p>
      <div className="mt-1 flex gap-3">
        <button type="button" onClick={() => setStage("first")} className={seg(stage === "first")}>
          {t("tools.dlFirst")}
        </button>
        <button type="button" onClick={() => setStage("appeal")} className={seg(stage === "appeal")}>
          {t("tools.dlAppeal")}
        </button>
      </div>

      {ok && deadline && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate">
            {t(stage === "first" ? "tools.dlResultAppeal" : "tools.dlResultKass")}
            {" · "}
            {t("tools.dlMonths", { n: PERIODS[caseType][stage] })}
          </p>
          <p className="mt-1 text-4xl font-extrabold text-navy">{iso(deadline)}</p>
          <p className="mt-2 text-sm text-slate">
            {t(`common.wd.${((deadline.getDay() + 6) % 7) + 1}`)}
            {daysLeft !== null && daysLeft >= 0 && <> · {t("tools.dlLeft", { n: daysLeft })}</>}
            {daysLeft !== null && daysLeft < 0 && (
              <span className="font-semibold text-red-600"> · {t("tools.dlPassed")}</span>
            )}
          </p>
          {shifted && <p className="mt-2 text-xs text-amber-700">{t("tools.dlShifted")}</p>}
        </div>
      )}

      <p className="mt-8 text-xs text-slate">{t("tools.dlHolidays")}</p>
      <p className="mt-2 text-xs text-slate">{t("tools.legalNote")}</p>
    </div>
  );
}
