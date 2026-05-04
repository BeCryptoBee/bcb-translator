import { describe, it, expect } from 'vitest';
import { detectLanguage } from '~/lib/lang-detect';

describe('detectLanguage', () => {
  it('detects english', () => {
    expect(detectLanguage('Hello there, this is a sentence in English.')).toBe('en');
  });

  it('detects ukrainian', () => {
    expect(detectLanguage('Привіт, як справи сьогодні? Це український текст.')).toBe('uk');
  });

  it('returns "und" for very short input', () => {
    expect(detectLanguage('hi')).toBe('und');
  });

  it('overrides Russian → Ukrainian when text contains UK-only letters', () => {
    // This sentence is real Ukrainian but franc-min often mis-classifies
    // such borderline ru/uk sentences as Russian — UK-only letters
    // (ї/є/і/ґ) are the tiebreaker.
    const text =
      'Я не прихильник і не хейтер чогось конкретного, для мене нормально слідкувати за декількома проєктами і не хейтити інші';
    expect(detectLanguage(text)).toBe('uk');
  });

  it('does NOT override when no UK-only letter is present (genuine Russian stays ru)', () => {
    const text = 'Это длинное предложение на русском языке без каких-либо особых украинских букв.';
    expect(detectLanguage(text)).toBe('ru');
  });
});
