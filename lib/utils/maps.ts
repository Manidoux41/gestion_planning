/** Lien Google Maps vers le domicile familial : coordonnées GPS si disponibles, sinon adresse texte. */
export function googleMapsLink(address: string | null, latitude: number | null, longitude: number | null): string | null {
  if (latitude !== null && longitude !== null) return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  if (address && address.trim()) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  return null;
}

/** URL d'iframe Google Maps sans clé d'API. */
export function googleMapsEmbed(address: string | null, latitude: number | null, longitude: number | null): string | null {
  const query = latitude !== null && longitude !== null ? `${latitude},${longitude}` : address?.trim();
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}
