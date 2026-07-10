"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Day = {
  dateIso: string;
  weekday: number;
  slots: { label: string; startAt: string }[];
};

export default function ReschedulePicker({
  bookingId,
  lawyerSlug,
  serviceId,
}: {
  bookingId: string;
  lawyerSlug: string;
  serviceId: string;
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("reschedule.errors.UNAUTHORIZED"),
    SLOT_TAKEN: t("reschedule.errors.SLOT_TAKEN"),
    TOO_LATE: t("reschedule.errors.TOO_LATE"),
    LIMIT_REACHED: t("reschedule.errors.LIMIT_REACHED"),
    NOT_FOUND: t("reschedule.errors.NOT_FOUND"),
    INVALID_BODY: t("reschedule.errors.INVALID_BODY"),
    DEFAULT: t("reschedule.errors.DEFAULT"),
  };
  const [days, setDays] = useState<Day[] | null>(null);
  const [picked, setPicked] = useState<{ label: string; startAt: string; dateIso: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadSlots() {
    setDays(null);
    setPicked(null);
    try {
      const res = await fetch(
        `/api/lawyers/${lawyerSlug}/slots?serviceId=${serviceId}`
      );
      const data = await res.json();
      setDays(data.ok ? data.days : []);
    } catch {
      setDays([]);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawyerSlug, serviceId]);

  async function confirm() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: picked.startAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        if (data.error === "SLOT_TAKEN") await loadSlots();
        return;
      }
      window.location.href = "/bookings";
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {days === null && <p className="text-sm text-slate">{t("common.loadingSlots")}</p>}
      {days !== null && days.length === 0 && (
        <p className="rounded-xl bg-gray-50 p-3 text-sm">
          {t("common.noSlots")}
        </p>
      )}

      {days !== null && days.length > 0 && (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {days.map((d) => (
            <div key={d.dateIso}>
              <p className="text-xs font-medium text-navy">
                {t(`common.wd.${d.weekday}`)} · {d.dateIso}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {d.slots.map((s) => {
                  const active = picked?.startAt === s.startAt;
                  return (
                    <button
                      key={s.startAt}
                      type="button"
                      onClick={() =>
                        setPicked({ label: s.label, startAt: s.startAt, dateIso: d.dateIso })
                      }
                      className={`rounded border px-2 py-1 text-xs ${
                        active
                          ? "border-navy bg-navy text-white"
                          : "border-gray-300 hover:border-navy"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {picked && (
        <p className="mt-4 rounded-xl bg-navy/5 p-3 text-sm">
          {t("reschedule.newTime")}{" "}
          <b className="text-navy">
            {picked.dateIso} · {picked.label}
          </b>
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={confirm}
        disabled={!picked || busy}
        className="mt-4 w-full rounded-xl bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : t("bookings.reschedule")}
      </button>
    </div>
  );
}
