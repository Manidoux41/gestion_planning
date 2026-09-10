import { Phone } from "lucide-react";
import { telegramLinkFromPhone } from "@/lib/contact/telegram";

/** Ouvre la conversation Telegram du numéro pour lancer un appel audio ou vidéo. */
export function TelegramCallButton({ phone, label = "Appeler sur Telegram" }: { phone: string | null | undefined; label?: string }) {
  const href = telegramLinkFromPhone(phone);
  if (!href) return null;
  return (
    <a className="outline-button telegram-button" href={href} target="_blank" rel="noopener noreferrer">
      <Phone size={15} /> {label}
    </a>
  );
}
