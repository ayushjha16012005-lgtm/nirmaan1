import { describe, it, expect } from 'vitest';
import { languageDetector } from '../src/voice/language.js';

describe('Multilingual Indian Language Detection Suite', () => {
  const testCases = [
    { text: 'मुझे नोएडा में एक प्लंबर चाहिए', expected: 'hi', name: 'Hindi' },
    { text: 'का हो हमके एगो मिस्त्री चाहीं', expected: 'bho', name: 'Bhojpuri' },
    { text: 'आहां कतेक टका लेब', expected: 'mai', name: 'Maithili' },
    { text: 'मला एक इलेक्ट्रिशियन पाहिजे आहे', expected: 'mr', name: 'Marathi' },
    { text: 'আমাকে একজন রাজমিস্ত্রি দিন', expected: 'bn', name: 'Bengali' },
    { text: 'எனக்கு ஒரு பிளம்பர் வேண்டும்', expected: 'ta', name: 'Tamil' },
    { text: 'నాకు ఒక కార్పెంటర్ కావాలి', expected: 'te', name: 'Telugu' },
    { text: 'મને એક સુથાર જોઈએ છે', expected: 'gu', name: 'Gujarati' },
    { text: 'ਮੈਨੂੰ ਇੱਕ ਪਲੰਬਰ ਦੀ ਲੋੜ ਹੈ', expected: 'pa', name: 'Punjabi' },
    { text: 'Need a certified mason in Delhi', expected: 'en', name: 'English' },
  ];

  for (const { text, expected, name } of testCases) {
    it(`should correctly classify ${name} query`, () => {
      const detected = languageDetector.detectLanguage(text);
      expect(detected).toBe(expected);
    });
  }
});
