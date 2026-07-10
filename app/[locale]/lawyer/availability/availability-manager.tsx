"use client";

import { useState } from "react";
import { fmtMin, WEEKDAY_ORDER } from "@/lib/slots";
import { useTranslations } from "next-intl";

type Rule = { id: string; weekday: number; startMin: number; endMin: number };
type Settings = { bookingMode: "INSTANT" | "REQUEST"; bufferMin: number };

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function AvailabilityManager({
  settings,
  rules,
}: {
  settings: Settings;
  rules: Rule[];
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("avail.errors.UNAUTHORIZED"),
    NO_PROFILE: t("avail.errors.NO_PROFILE"),
    INVALID_BODY: t("avail.errors.INVALID_BODY"),
    OVERLAP: t("avail.errors.OVERLAP"),
    NOT_FOUND: t("avail.errors.NOT_FOUND"),
    DEFAULT: t("avail.errors.DEFAULT"),
  };
  const [bookingMode, setBookingMode] = useState(settings.bookingMode);
  const [bufferMin, setBufferMin] = useState(String(settings.bufferMin));
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return false;
      }
      return true;
    } catch {
      setError(ERRORS.DEFAULT);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    const ok = await call("/api/lawyer/settings", {
      method: "PATCH",
      body: JSON.stringify({ bookingMode, bufferMin: Number(bufferMin) }),
    });
    if (ok) setSaved(true);
  }

  async function addRule() {
    const ok = await call("/api/lawyer/availability", {
      method: "POST",
      body: JSON.stringify({
        weekday: Number(weekday),
        startMin: toMin(start),
        endMin: toMin(end),
      }),
    });
    if (ok) window.location.reload();
  }

  async function removeRule(id: string) {
    const ok = await call(`/api/lawyer/availability/${id}`, {
      method: "DELETE",
    });
    if (ok) window.location.reload();
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded border border-gray-200 p-4">
        <p className="text-sm font-medium text-navy">{t("avail.mode")}</p>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={bookingMode === "REQUEST"}
              onChange={() => setBookingMode("REQUEST")}
            />
            {t("avail.modeReq")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={bookingMode === "INSTANT"}
              onChange={() => setBookingMode("INSTANT")}
            />
            {t("avail.modeInstant")}
          </label>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div>
            <label htmlFor="buffer" className="block text-xs text-slate">
              {t("avail.buffer")}
            </label>
            <select
              id="buffer"
              value={bufferMin}
              onChange={(e) => setBufferMin(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
            >
              {[0, 5, 10, 15].map((b) => (
                <option key={b} value={b}>
                  {b} {t("common.min")}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={saveSettings}
            disabled={busy}
            className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
          >
            Yadda saxla
          </button>
          {saved && <span className="pb-2 text-sm text-emerald">{t("common.savedTick")}</span>}
        </div>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <p className="text-sm font-medium text-navy">{t("avail.weekly")}</p>

        <div className="mt-3 space-y-2">
          {rules.length === 0 && (
            <p className="text-sm text-slate">{t("avail.empty")}</p>
          )}
          {WEEKDAY_ORDER.map((wd) => {
            const dayRules = rules.filter((r) => r.weekday === wd);
            if (dayRules.length === 0) return null;
            return (
              <div key={wd} className="text-sm">
                <p className="font-medium text-navy">{t(`common.wd.${wd}`)}</p>
                <div className="mt-1 space-y-1">
                  {dayRules.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                    >
                      <span>
                        {fmtMin(r.startMin)} – {fmtMin(r.endMin)}
                      </span>
                      <button
                        onClick={() => removeRule(r.id)}
                        disabled={busy}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <form
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            addRule();
          }}
        >
          <div>
            <label htmlFor="wd" className="block text-xs text-slate">
              {t("avail.day")}
            </label>
            <select
              id="wd"
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
            >
              {WEEKDAY_ORDER.map((wd) => (
                <option key={wd} value={wd}>
                  {t(`common.wd.${wd}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ts" className="block text-xs text-slate">
              {t("avail.start")}
            </label>
            <input
              id="ts"
              type="time"
              step={300}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
            />
          </div>
          <div>
            <label htmlFor="te" className="block text-xs text-slate">
              Son
            </label>
            <input
              id="te"
              type="time"
              step={300}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
            />
          </div>
          <button
            disabled={busy}
            className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
          >
            {t("common.add")}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
