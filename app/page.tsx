import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-navy">Vəkilinizi tapın</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg">
        Yoxlanılmış vəkillər və hüquqşünaslarla tanış olun və sizə uyğununu
        seçin.
      </p>
      <form
        method="GET"
        action="/lawyers"
        className="mx-auto mt-8 flex max-w-md gap-2"
      >
        <input
          name="q"
          placeholder="Ad, sahə və ya açar söz…"
          className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-navy"
        />
        <button className="rounded bg-navy px-6 py-3 font-medium text-white hover:bg-navy-dark">
          Axtar
        </button>
      </form>
      <Link href="/lawyers" className="mt-4 inline-block text-sm text-emerald underline">
        Bütün vəkillərə bax
      </Link>
    </section>
  );
}
