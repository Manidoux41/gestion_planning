/** Construit le lien Telegram permettant d'appeler/écrire à un numéro enregistré sur Telegram. */
export function telegramLinkFromPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://t.me/+${digits}`;
}
