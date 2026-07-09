import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-navy">Vəkilinizi tapın</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg">
        Yoxlanılmış vəkillər və hüquqşünaslarla onlayn görüş — tezliklə.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-block rounded bg-navy px-6 py-3 font-medium text-white hover:bg-navy-dark"
      >
        Daxil ol
      </Link>
    </section>
  );
}
