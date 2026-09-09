import { en } from "./en";
import { ja, type MessageKey } from "./ja";

export type Locale = "ja" | "en";
export type { MessageKey };

const catalogs: Record<Locale, Record<MessageKey, string>> = { ja, en };

let locale: Locale = detectLocale();

/** 端末の言語。ja 以外は英語。アプリ内の言語メニューは持たない */
export function detectLocale(): Locale {
  const tags = [...(navigator.languages ?? []), navigator.language];
  for (const tag of tags) {
    if (tag.toLowerCase().startsWith("ja")) {
      return "ja";
    }
  }
  return "en";
}

export function getLocale(): Locale {
  return locale;
}

export function applyDocumentLocale(): void {
  locale = detectLocale();
  document.documentElement.lang = locale;
}

export function t(
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text = catalogs[locale][key] ?? catalogs.en[key] ?? key;
  if (!vars) {
    return text;
  }
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}
