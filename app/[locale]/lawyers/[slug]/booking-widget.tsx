"use client";

import { useEffect, useState } from "react";
import { formatAzn } from "@/lib/money";
import { WEEKDAY_LABELS_AZ } from "@/lib/slots";

type CallService = {
  id: string;
  type: "VIDEO" | "AUDIO";
  durationMin: number | null;
  priceQepik: number;
};

type Day = {
  dateIso: string;
  weekday: number;
  slots: { label: string; startAt: string }[];
};

const TYPE_LABELS: Record<CallService["type"], string> = {
  VIDEO: "Video görüş",
  AUDIO: "Səsli zəng",
};

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  SLOT_TAKEN: "Bu slot artıq tutulub — başqasını seçin.",
  OWN_SERVICE: "Öz xidmətinizi sifariş edə bilməzsiniz.",
  NOT_FOUND: "Xidmət tapılmadı. Səhifəni yeniləyin.",
  INVALID_BODY: "Məlumatlar düzgün deyil.",
  TOO_MANY_REQUESTS: "Çox sürətli əməliyyat — bir neçə dəqiqə sonra yenidən cəhd edin.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function BookingWidget({
  lawyerSlug,
  services,
  loggedIn,
  bookingMode,
}: {
  lawyerSlug: string;
  services: CallService[];
  loggedIn: boolean;
  bookingMode: "INSTANT" | "REQUEST";
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [days, setDays] = useState<Day[] | null>(null);
  const [picked, setPicked] = useState<{
    dateIso: string;
    label: string;
    startAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    if (!serviceId) return;
    setDays(null);
    setPicked(null);
    setError(null);
    fetch(`/api/lawyers/${lawyerSlug}/slots?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => setDays(data.ok ? data.days : []))
      .catch(() => setDays([]));
  }, [serviceId, lawyerSlug]);

  async function book() {
    if (!picked) return;
    if (!loggedIn) {
      window.location.href = `/login?next=/lawyers/${lawyerSlug}`;
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, startAt: picked.startAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        if (data.error === "SLOT_TAKEN") {
          const r = await fetch(
            `/api/lawyers/${lawyerSlug}/slots?serviceId=${serviceId}`
          ).then((x) => x.json());
          setDays(r.ok ? r.days : []);
          setPicked(null);
        }
        return;
      }
      window.location.href = `/pay/${data.id}`;
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  if (services.length === 0) return null;

  return (
    <div className="mt-10 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate">
        Onlayn görüş sifariş et
      </h2>

      <div className="mt-3">
        <label htmlFor="bw-service" className="block text-xs text-slate">
          Xidmət
        </label>
        <select
          id="bw-service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {TYPE_LABELS[s.type]} · {s.durationMin} dəq ·{" "}
              {formatAzn(s.priceQepik)}
            </option>
          ))}
        </select>
      </div>

      {days === null && (
        <p className="mt-4 text-sm text-slate">Slotlar yüklənir…</p>
      )}
      {days !== null && days.length === 0 && (
        <p className="mt-4 rounded bg-gray-50 p-3 text-sm">
          Yaxın 14 gündə boş slot yoxdur.
        </p>
      )}

      {days !== null && days.length > 0 && (
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
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
                        setPicked({ dateIso: d.dateIso, label: s.label, startAt: s.startAt })
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

      {picked && service && (
        <div className="mt-4 rounded bg-navy/5 p-3 text-sm">
          <p>
            <b className="text-navy">{TYPE_LABELS[service.type]}</b> ·{" "}
            {picked.dateIso} · {picked.label} · {service.durationMin} dəq
          </p>
          <p className="mt-1">
            Qiymət:{" "}
            <b className="text-navy">{formatAzn(service.priceQepik)}</b>
            {bookingMode === "REQUEST" && (
              <span className="text-slate">
                {" "}
                · vəkil təsdiqlədikdən sonra keçərlidir
              </span>
            )}
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={book}
        disabled={!picked || busy}
        className="mt-4 w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : loggedIn ? "Davam et" : "Daxil ol və davam et"}
      </button>
    </div>
  );
}
