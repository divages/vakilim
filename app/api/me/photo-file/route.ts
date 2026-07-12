import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadObject, s3Env, presignRecordingUrl } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX = 3 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  if (!checkRateLimit(req, "photo", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!s3Env())
    return NextResponse.json({ ok: false, error: "STORAGE_OFF" }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const f = form?.get("photo");
  if (!(f instanceof File) || !TYPES.has(f.type) || f.size === 0 || f.size > MAX)
    return NextResponse.json({ ok: false, error: "BAD_FILE" }, { status: 400 });
  const buffer = Buffer.from(await f.arrayBuffer());
  const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
  const key = `avatars/${user.id}/${Date.now()}.${ext}`;
  await uploadObject(key, buffer, f.type);
  await prisma.user.update({ where: { id: user.id }, data: { photoKey: key } });
  await prisma.lawyerProfile.updateMany({
    where: { userId: user.id },
    data: { photoKey: key },
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { photoKey: true },
  });
  if (!row?.photoKey) return new NextResponse(null, { status: 404 });
  const url = await presignRecordingUrl(row.photoKey, 600);
  if (!url) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(url, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
