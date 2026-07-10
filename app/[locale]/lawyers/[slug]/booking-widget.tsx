"use client";

import { useEffect, useState } from "react";
import { formatAzn } from "@/lib/money";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("widget.errors.UNAUTHORIZED"),
    SLOT_TAKEN: t("widget.errors.SLOT_TAKEN"),
    OWN_SERVICE: t("widget.errors.OWN_SERVICE"),
    NOT_FOUND: t("widget.errors.NOT_FOUND"),
    INVALID_BODY: t("widget.errors.INVALID_BODY"),
    TOO_MANY_REQUESTS: t("widget.errors.TOO_MANY_REQUESTS"),
    DEFAULT: t("widget.errors.DEFAULT"),
  };
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
        {t("widget.title")}
      </h2>

      <div className="mt-3">
        <label htmlFor="bw-service" className="block text-xs text-slate">
          {t("widget.service")}
        </label>
        <select
          id="bw-service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {t(`common.serviceType.${s.type}`)} · {s.durationMin} {t("common.min")} ·{" "}
              {formatAzn(s.priceQepik)}
            </option>
          ))}
        </select>
      </div>

      {days === null && (
        <p className="mt-4 text-sm text-slate">{t("common.loadingSlots")}</p>
      )}
      {days !== null && days.length === 0 && (
        <p className="mt-4 rounded bg-gray-50 p-3 text-sm">
          {t("common.noSlots")}
        </p>
      )}

      {days !== null && days.length > 0 && (
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
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
            <b className="text-navy">{t(`common.serviceType.${service.type}`)}</b> ·{" "}
            {picked.dateIso} · {picked.label} · {service.durationMin} {t("common.min")}
          </p>
          <p className="mt-1">
            {t("widget.price")}{" "}
            <b className="text-navy">{formatAzn(service.priceQepik)}</b>
            {bookingMode === "REQUEST" && (
              <span className="text-slate">
                {" "}
                {t("widget.afterConfirm")}
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
        {busy ? "…" : loggedIn ? t("widget.continue") : t("widget.loginContinue")}
      </button>
    </div>
  );
}
