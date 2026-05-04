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

// Alphabet-based UK/RU disambiguation. franc-min uses trigram statistics,
// which fail on short Cyrillic text where ~85% of trigrams overlap between
// uk and ru. The alphabet itself is a far more reliable signal: certain
// letters appear in EXACTLY ONE of the two languages.
//   UK-only: Ї ї Є є І і Ґ ґ          (Russian alphabet has none of these)
//   RU-only: Ы ы Ъ ъ Э э Ё ё          (Ukrainian alphabet has none of these)
const UK_SPECIFIC_LETTERS = /[ЇїЄєІіҐґ]/;
const RU_SPECIFIC_LETTERS = /[ЫыЪъЭэЁё]/;
// Cyrillic block (covers uk, ru, be, bg, mk, sr — anything we'd see in
// the wild on Twitter-style input).
const CYRILLIC = /[Ѐ-ӿ]/g;

export function detectLanguage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 10) return 'und';

  // Cyrillic fast-path: when the text is mostly Cyrillic, decide uk vs ru
  // by alphabet first. This is more reliable than franc on short inputs.
  const cyrillicCount = (trimmed.match(CYRILLIC) ?? []).length;
  const cyrillicShare = cyrillicCount / trimmed.length;
  if (cyrillicShare > 0.3) {
    if (UK_SPECIFIC_LETTERS.test(trimmed)) return 'uk';
    if (RU_SPECIFIC_LETTERS.test(trimmed)) return 'ru';
    // Ambiguous: no language-specific letters yet (rare — both languages
    // sprinkle them frequently). Fall back to franc inside the Cyrillic
    // family, defaulting to ru if franc is also unsure.
    const code3 = franc(trimmed);
    if (code3 === 'ukr') return 'uk';
    return 'ru';
  }

  // Non-Cyrillic input — defer to franc.
  const code3 = franc(trimmed);
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
