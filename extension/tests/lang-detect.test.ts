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

  it('detects uk via alphabet on a borderline sentence franc would mis-classify', () => {
    const text =
      'Я не прихильник і не хейтер чогось конкретного, для мене нормально слідкувати за декількома проєктами і не хейтити інші';
    expect(detectLanguage(text)).toBe('uk');
  });

  it('detects uk on a SHORT cyrillic sentence with є / і', () => {
    // The kind of short reply where franc usually returns "und" or some
    // unrelated cyrillic family code (bul / srp / mkd).
    expect(detectLanguage('Тим паче, проєкту який дав мені купу грошей.')).toBe('uk');
  });

  it('detects ru via alphabet (ы/ъ/э/ё)', () => {
    expect(detectLanguage('Это длинное предложение на русском языке без украинских букв.')).toBe('ru');
  });

  it('detects ru on a short cyrillic sentence with ы', () => {
    expect(detectLanguage('Привет, как дела сегодня?')).toBe('ru');
  });
});
