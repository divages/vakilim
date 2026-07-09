type SendArgs = { to: string; subject: string; text: string };

/**
 * Dev mode (no RESEND_API_KEY): logs the email to the server console.
 * Production: sends via Resend's HTTP API — no SDK required.
 */
export async function sendEmail({ to, subject, text }: SendArgs) {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.log(
      `\n[EMAIL DEV] to: ${to}\n[EMAIL DEV] subject: ${subject}\n[EMAIL DEV] ${text}\n`
    );
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Vakilim <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
  return { ok: res.ok, dev: false };
}
