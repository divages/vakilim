import { z } from "zod";

/** Boot-time env validation: a missing secret fails loudly with a name,
 *  not quietly at runtime. Gated integrations stay optional by design. */
const schema = z.object({
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  DATABASE_URL: z.string().min(10).startsWith("postgres"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`[env] invalid server environment — ${problems}`);
}

export const env = parsed.data;
