import i18n from "i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export async function initI18n(locale: Locale = DEFAULT_LOCALE) {
  if (!i18n.isInitialized) {
    await i18n.init({
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      resources: {
        en: { translation: en },
        fr: { translation: fr },
      },
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export { i18n };
