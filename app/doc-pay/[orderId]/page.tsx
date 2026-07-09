import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import DocPayButton from "./doc-pay-button";

export default async function DocPayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/doc-pay/${orderId}`);

  const order = await prisma.docOrder.findUnique({
    where: { id: orderId },
    include: { templateVersion: { include: { template: true } } },
  });
  if (!order || order.userId !== user.id) redirect("/documents");
  if (order.status !== "PENDING_PAYMENT") redirect("/documents");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Ödəniş</h1>

      <div className="mt-6 rounded border border-gray-200 p-4 text-sm">
        <p className="font-medium text-navy">
          {order.templateVersion.template.titleAz}
        </p>
        <p className="mt-1 text-xs text-slate">Sənəd № {order.docUid}</p>
        <p className="mt-3 text-lg font-semibold text-navy">
          {formatAzn(order.priceQepik)}
        </p>
      </div>

      <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Test rejimi — real kart tələb olunmur. Canlı ödənişlər Epoint
        inteqrasiyası ilə əlavə olunacaq.
      </div>

      <DocPayButton orderId={order.id} />
    </div>
  );
}
