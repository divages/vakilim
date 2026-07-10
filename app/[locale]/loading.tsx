export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-6 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
      </div>
    </div>
  );
}
