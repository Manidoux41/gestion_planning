import Image from "next/image";

/** Avatar de profil : photo envoyée par la famille ou l'employée, sinon initiales colorées. */
export function ProfileAvatar({ photoUrl, initials, color = "sage", size = 48 }: { photoUrl?: string | null; initials: string; color?: string; size?: number }) {
  if (photoUrl) {
    return <Image className="entity-avatar avatar-photo" src={photoUrl} alt={initials} width={size} height={size} unoptimized />;
  }
  return <div className={`entity-avatar ${color}`}>{initials}</div>;
}
