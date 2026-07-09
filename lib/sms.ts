export async function sendOtpSms(phone: string, code: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[SMS DEV] OTP for ${phone}: ${code}\n`);
    return;
  }
  throw new Error("SMS provider not configured yet"); // real provider in Sprint 4
}