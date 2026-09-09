import { getDictionary, localeIntlTag, type Locale } from "./dictionary";

export type { Locale } from "./dictionary";

export function translator(locale: Locale) {
  const dict = getDictionary(locale);
  return (key: string) => dict[key] ?? key;
}

export function intlTag(locale: Locale) {
  return localeIntlTag[locale] ?? "fr-FR";
}
