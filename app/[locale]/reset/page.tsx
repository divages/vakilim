import ResetForm from "./reset-form";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <ResetForm token={sp.token ?? ""} />
    </div>
  );
}
