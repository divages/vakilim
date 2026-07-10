import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type EmailTokenType = "VERIFY" | "RESET";

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

/** Creates a one-time token; only its hash is stored. Returns the raw
 *  token for the email link. */
export async function createEmailToken(
  userId: string,
  type: EmailTokenType,
  ttlMin: number
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await prisma.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + ttlMin * 60_000),
    },
  });
  return raw;
}

/** Consumes a token exactly once. Returns the userId or null. */
export async function consumeEmailToken(
  raw: string,
  type: EmailTokenType
): Promise<string | null> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: sha256(raw) },
  });
  if (!row || row.type !== type) return null;
  if (row.consumedAt || row.expiresAt < new Date()) return null;
  await prisma.emailToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return row.userId;
}
