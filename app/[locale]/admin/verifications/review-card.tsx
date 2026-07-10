"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type Application = {
  id: string;
  fullName: string;
  photoKey: string | null;
  phone: string;
  type: "ADVOCATE" | "LICENSED_LAWYER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  licenseNo: string;
  yearsExperience: number;
  city: string;
  bio: string;
  languages: string[];
  areas: string[];
  licenseDocUrl: string | null;
  licenseDocIsPdf: boolean;
  idDocUrl: string | null;
  idDocIsPdf: boolean;
};


const STATUS_CLS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald/15 text-navy",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ReviewCard({ app }: { app: Application }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    FORBIDDEN: t("admV.errors.FORBIDDEN"),
    NOT_FOUND: t("admV.errors.NOT_FOUND"),
    REASON_REQUIRED: t("admV.errors.REASON_REQUIRED"),
    INVALID_BODY: t("admV.errors.INVALID_BODY"),
    DEFAULT: t("admV.errors.DEFAULT"),
  };
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && reason.trim().length < 5) {
      setError(ERRORS.REASON_REQUIRED);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "REJECT" ? { action, reason: reason.trim() } : { action }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.reload();
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const badge = { cls: STATUS_CLS[app.status], label: t(`admV.status.${app.status}`) };

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {app.photoKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/avatars/${app.id}`}
              alt=""
              className="mb-2 h-12 w-12 rounded-full object-cover ring-2 ring-emerald-100"
            />
          )}
          <p className="font-medium text-navy">{app.fullName}</p>
          <p className="text-sm">{app.phone}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Row k={t("dash.rowStatus")} v={t(`common.lawyerTypeFull.${app.type}`)} />
        <Row k={t("apply.licenseNo")} v={app.licenseNo} />
        <Row k={t("apply.city")} v={app.city} />
        <Row k={t("dash.rowYears")} v={t("directory.years", { y: app.yearsExperience })} />
        <Row k={t("apply.langs")} v={app.languages.join(", ")} />
        <Row k={t("dash.rowAreas")} v={app.areas.join(", ")} />
      </dl>

      <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">{app.bio}</p>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">
          {t("admV.docs")}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <DocTile label={t("apply.licDoc")} url={app.licenseDocUrl} isPdf={app.licenseDocIsPdf} />
          <DocTile label={t("apply.idDoc")} url={app.idDocUrl} isPdf={app.idDocIsPdf} />
        </div>
      </div>

      {app.status === "REJECTED" && app.rejectionReason && (
        <p className="mt-2 text-sm text-red-700">
          {t("admV.reason")} {app.rejectionReason}
        </p>
      )}

      {rejecting && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={t("admV.reasonPh")}
          className="mt-3 w-full rounded-xl border border-gray-100 px-3 py-2 text-sm outline-none focus:border-navy"
          autoFocus
        />
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-3">
        {!rejecting ? (
          <>
            <button
              onClick={() => decide("APPROVE")}
              disabled={busy || app.status === "APPROVED"}
              className="rounded-xl bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "…" : t("login.verify")}
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={busy || app.status === "REJECTED"}
              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              {t("admV.reject")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => decide("REJECT")}
              disabled={busy}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "…" : t("admV.confirmReject")}
            </button>
            <button
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError(null);
              }}
              disabled={busy}
              className="rounded-xl border border-gray-100 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {t("admV.cancel")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DocTile({
  label,
  url,
  isPdf,
}: {
  label: string;
  url: string | null;
  isPdf: boolean;
}) {
  const t = useTranslations();
  if (!url)
    return (
      <span className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-slate">
        {label}: {t("admV.noDoc")}
      </span>
    );
  if (isPdf)
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-gray-100 px-3 py-2 text-xs font-medium text-navy hover:border-navy"
      >
        📄 {label} (PDF)
      </a>
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-24 w-36 rounded-2xl border border-gray-100 shadow-sm object-cover hover:border-navy"
      />
      <span className="mt-1 block text-center text-xs text-slate">{label}</span>
    </a>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 sm:justify-start">
      <dt className="text-slate">{k}:</dt>
      <dd className="font-medium text-navy">{v}</dd>
    </div>
  );
}
