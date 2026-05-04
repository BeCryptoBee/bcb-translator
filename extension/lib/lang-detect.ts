import { franc } from 'franc-min';

const ISO6393_TO_ISO6391: Record<string, string> = {
  eng: 'en',
  ukr: 'uk',
  rus: 'ru',
  pol: 'pl',
  deu: 'de',
  spa: 'es',
  fra: 'fr',
  cmn: 'zh',
  jpn: 'ja',
  por: 'pt',
  ita: 'it',
  tur: 'tr',
  nld: 'nl',
  ara: 'ar',
};

// Letters that exist in Ukrainian but NOT in Russian. If any of these
// appear in the text, the source is almost certainly Ukrainian — even when
// franc-min mis-classifies it as Russian (which it does on short or mixed
// inputs because uk/ru share most trigrams).
const UK_SPECIFIC_LETTERS = /[ЇїЄєІіҐґ]/;

export function detectLanguage(text: string): string {
  if (text.trim().length < 10) return 'und';
  const code3 = franc(text);
  // Override: when franc says Russian or "unknown" but the text contains
  // UK-only letters, trust the letters.
  if ((code3 === 'rus' || code3 === 'und') && UK_SPECIFIC_LETTERS.test(text)) {
    return 'uk';
  }
  if (code3 === 'und') return 'und';
  return ISO6393_TO_ISO6391[code3] ?? 'und';
}

/**
 * Smart-direction target resolver. Used by the floating-bar T button.
 * Rule: Ukrainian source -> English; anything else (or unknown) -> the
 * user's configured targetLang.
 */
export function pickSmartTarget(
  detected: string,
  settings: { targetLang: string },
): string {
  if (detected === 'uk') return 'en';
  return settings.targetLang;
}
