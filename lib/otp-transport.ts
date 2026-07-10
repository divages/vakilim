/**
 * OTP delivery. When the three WhatsApp env vars are present, codes go
 * out via Meta's WhatsApp Business Cloud API using an approved
 * AUTHENTICATION template; otherwise they are logged for demo use.
 *
 * Required env for live delivery:
 *   WHATSAPP_TOKEN            permanent system-user token
 *   WHATSAPP_PHONE_NUMBER_ID  from WhatsApp > API Setup
 *   WHATSAPP_TEMPLATE         template name (default "otp_login")
 * Optional:
 *   WHATSAPP_API_VERSION      default "v20.0"
 *   WHATSAPP_LANG_AZ/RU/EN    override template language codes if your
 *                             approved templates use e.g. "en_US"
 */

const LANG: Record<string, string> = {
  az: process.env.WHATSAPP_LANG_AZ ?? "az",
  ru: process.env.WHATSAPP_LANG_RU ?? "ru",
  en: process.env.WHATSAPP_LANG_EN ?? "en",
};

export function buildOtpPayload(phone: string, code: string, locale: string) {
  return {
    messaging_product: "whatsapp",
    to: phone.replace(/^\+/, ""),
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE ?? "otp_login",
      language: { code: LANG[locale] ?? LANG.az },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  };
}

export async function sendOtp(
  phone: string,
  code: string,
  locale: string
): Promise<{ ok: boolean }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.log(`[OTP DEV] WhatsApp not configured — code for ${phone}: ${code}`);
    return { ok: true };
  }
  try {
    const ver = process.env.WHATSAPP_API_VERSION ?? "v20.0";
    const res = await fetch(
      `https://graph.facebook.com/${ver}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildOtpPayload(phone, code, locale)),
      }
    );
    if (!res.ok) {
      console.error("WhatsApp send failed:", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return { ok: false };
  }
}
