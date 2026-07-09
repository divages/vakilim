/**
 * SMS transport. A real provider (operator API) lands in a later sprint;
 * until then codes are logged server-side. This must never throw — login
 * is checkout-critical.
 */
export async function sendOtpSms(phone: string, code: string) {
  console.log(`\n[SMS DEV] OTP for ${phone}: ${code}\n`);
}
