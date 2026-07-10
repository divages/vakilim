"use client";

import { useEffect, useState } from "react";
import { WEEKDAY_LABELS_AZ } from "@/lib/slots";

type Day = {
  dateIso: string;
  weekday: number;
  slots: { label: string; startAt: string }[];
};

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  SLOT_TAKEN: "Bu slot artıq tutulub — başqasını seçin.",
  TOO_LATE: "Görüşə 24 saatdan az qalıb — vaxtı dəyişmək mümkün deyil.",
  LIMIT_REACHED: "Vaxtı yalnız 1 dəfə dəyişmək olar.",
  NOT_FOUND: "Görüş tapılmadı.",
  INVALID_BODY: "Məlumatlar düzgün deyil.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
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
      {days === null && <p className="text-sm text-slate">Slotlar yüklənir…</p>}
      {days !== null && days.length === 0 && (
        <p className="rounded bg-gray-50 p-3 text-sm">
          Yaxın 14 gündə boş slot yoxdur.
        </p>
      )}

      {days !== null && days.length > 0 && (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {days.map((d) => (
            <div key={d.dateIso}>
              <p className="text-xs font-medium text-navy">
                {WEEKDAY_LABELS_AZ[d.weekday]} · {d.dateIso}
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
        <p className="mt-4 rounded bg-navy/5 p-3 text-sm">
          Yeni vaxt:{" "}
          <b className="text-navy">
            {picked.dateIso} · {picked.label}
          </b>
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={confirm}
        disabled={!picked || busy}
        className="mt-4 w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : "Vaxtı dəyiş"}
      </button>
    </div>
  );
}
