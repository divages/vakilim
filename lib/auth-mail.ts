/** Trilingual auth emails — flat strings, no translator machinery. */
const M = {
  verify: {
    az: { subject: "Vakilim.az — e-poçtunuzu təsdiqləyin", text: "Hesabınızı aktivləşdirmək üçün keçidə klikləyin:\n\n{link}\n\nKeçid 24 saat etibarlıdır." },
    ru: { subject: "Vakilim.az — подтвердите e-mail", text: "Нажмите на ссылку, чтобы активировать аккаунт:\n\n{link}\n\nСсылка действует 24 часа." },
    en: { subject: "Vakilim.az — verify your email", text: "Click the link to activate your account:\n\n{link}\n\nThe link is valid for 24 hours." },
  },
  reset: {
    az: { subject: "Vakilim.az — şifrə yeniləmə", text: "Yeni şifrə təyin etmək üçün keçid:\n\n{link}\n\nKeçid 1 saat etibarlıdır. Bu sorğunu siz göndərməmisinizsə, məktubu nəzərə almayın." },
    ru: { subject: "Vakilim.az — сброс пароля", text: "Ссылка для нового пароля:\n\n{link}\n\nДействует 1 час. Если это были не вы — просто игнорируйте письмо." },
    en: { subject: "Vakilim.az — password reset", text: "Set a new password:\n\n{link}\n\nValid for 1 hour. If this wasn't you, ignore this email." },
  },
} as const;

export function renderAuthMail(
  kind: keyof typeof M,
  locale: string,
  params: { link: string }
): { subject: string; text: string } {
  const loc = (["az", "ru", "en"].includes(locale) ? locale : "az") as "az" | "ru" | "en";
  const m = M[kind][loc];
  return { subject: m.subject, text: m.text.replace("{link}", params.link) };
}
