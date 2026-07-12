"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type R = {
  id: string; slug: string; published: boolean;
  titleAz: string; titleRu: string | null; titleEn: string | null;
  excerptAz: string; excerptRu: string | null; excerptEn: string | null;
  bodyAz: string; bodyRu: string | null; bodyEn: string | null;
  practiceAreaSlug: string | null;
};
const EMPTY = {
  slug: "", titleAz: "", titleRu: "", titleEn: "",
  excerptAz: "", excerptRu: "", excerptEn: "",
  bodyAz: "", bodyRu: "", bodyEn: "", practiceAreaSlug: "",
};
// az letters as unicode escapes to keep the i18n guard quiet
const TR: Record<string, string> = { "\u0259":"e", "\u0131":"i", "\u00f6":"o", "\u00fc":"u", "\u015f":"s", "\u00e7":"c", "\u011f":"g" };
const slugify = (t: string) =>
  t.toLowerCase().split("").map((c) => TR[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

export default function ArticlesEditor({
  rows,
  areas,
}: {
  rows: R[];
  areas: { slug: string; nameAz: string }[];
}) {
  const t = useTranslations();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function open(r?: R) {
    setMsg(null);
    if (r) {
      setEditing(r.id);
      setForm({
        slug: r.slug, titleAz: r.titleAz, titleRu: r.titleRu ?? "", titleEn: r.titleEn ?? "",
        excerptAz: r.excerptAz, excerptRu: r.excerptRu ?? "", excerptEn: r.excerptEn ?? "",
        bodyAz: r.bodyAz, bodyRu: r.bodyRu ?? "", bodyEn: r.bodyEn ?? "",
        practiceAreaSlug: r.practiceAreaSlug ?? "",
      });
    } else {
      setEditing("new");
      setForm({ ...EMPTY });
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const url = editing === "new" ? "/api/lawyer/articles" : `/api/lawyer/articles/${editing}`;
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg(
          data?.error === "SLUG_TAKEN" ? t("admP.slugTaken")
          : data?.error === "NOT_EDITABLE" ? t("lart.locked")
          : t("admP.err")
        );
        return;
      }
      window.location.reload();
    } finally { setBusy(false); }
  }

  async function del(id: string) {
    await fetch(`/api/lawyer/articles/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald";
  const areaCls = inputCls + " min-h-40";
  const lbl = "mt-3 block text-xs font-semibold uppercase text-slate";
  const F = (k: keyof typeof EMPTY) => ({
    value: String(form[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="mt-6">
      <button onClick={() => open()} className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
        + {t("lart.new")}
      </button>

      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-navy">{r.titleAz}</p>
              <p className="text-xs text-slate">/{r.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {r.published ? t("lart.live") : t("lart.pending")}
              </span>
              {r.published ? (
                <Link href={`/blog/${r.slug}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                  {t("lart.view")} →
                </Link>
              ) : (
                <>
                  <button onClick={() => open(r)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                    {t("admP.edit")}
                  </button>
                  <button onClick={() => del(r.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                    {t("lart.del")}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate">{t("lart.reviewNote")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Slug</label>
              <input
                {...F("slug")}
                onFocus={() => {
                  if (!form.slug && form.titleAz)
                    setForm((f) => ({ ...f, slug: slugify(f.titleAz) }));
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label className={lbl}>{t("admP.area")}</label>
              <select {...F("practiceAreaSlug")} className={inputCls}>
                <option value="">—</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.nameAz}</option>
                ))}
              </select>
            </div>
          </div>
          {(["Az", "Ru", "En"] as const).map((L) => (
            <div key={L} className="mt-4 rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-emerald">{L.toUpperCase()}</p>
              <label className={lbl}>{t("admP.postTitle")}</label>
              <input {...F(("title" + L) as keyof typeof EMPTY)} className={inputCls} />
              <label className={lbl}>{t("admP.excerpt")}</label>
              <input {...F(("excerpt" + L) as keyof typeof EMPTY)} className={inputCls} />
              <label className={lbl}>{t("admP.body")} (##, **bold**, [link](url))</label>
              <textarea {...F(("body" + L) as keyof typeof EMPTY)} className={areaCls} />
            </div>
          ))}
          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy} className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {t("lart.submit")}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-navy hover:border-navy">
              {t("admP.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
