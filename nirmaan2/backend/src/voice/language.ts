export type IndianLanguage =
  | 'hi' // Hindi
  | 'en' // English
  | 'bn' // Bengali
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'as' // Assamese
  | 'bho' // Bhojpuri
  | 'mai'; // Maithili

export class LanguageDetector {
  /**
   * Detects language code from transcribed text using unicode character blocks and keywords
   */
  detectLanguage(text: string): IndianLanguage {
    const trimmed = text.trim();

    // Check Devanagari script (Hindi, Marathi, Bhojpuri, Maithili)
    if (/[\u0900-\u097F]/.test(trimmed)) {
      if (/का हो|रउआ|हमके|बाटे|का बा/.test(trimmed)) return 'bho';
      if (/आहां|छी|हमरा/.test(trimmed)) return 'mai';
      if (/आहे|नाही|काय|करा/.test(trimmed)) return 'mr';
      return 'hi';
    }

    // Bengali / Assamese
    if (/[\u0980-\u09FF]/.test(trimmed)) {
      return 'bn';
    }

    // Tamil
    if (/[\u0B80-\u0BFF]/.test(trimmed)) {
      return 'ta';
    }

    // Telugu
    if (/[\u0C00-\u0C7F]/.test(trimmed)) {
      return 'te';
    }

    // Gujarati
    if (/[\u0A80-\u0AFF]/.test(trimmed)) {
      return 'gu';
    }

    // Punjabi (Gurmukhi)
    if (/[\u0A00-\u0A7F]/.test(trimmed)) {
      return 'pa';
    }

    return 'en';
  }
}

export const languageDetector = new LanguageDetector();
