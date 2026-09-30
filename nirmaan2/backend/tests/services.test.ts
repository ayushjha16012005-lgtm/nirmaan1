import { describe, it, expect } from 'vitest';
import { locationService } from '../src/services/location.service.js';
import { languageDetector } from '../src/voice/language.js';

describe('Location & Routing Service', () => {
  it('should accurately calculate distance between Delhi (Connaught Place) and Noida', () => {
    const cpDelhi = { latitude: 28.6315, longitude: 77.2167 };
    const noidaSec18 = { latitude: 28.5708, longitude: 77.326 };

    const distance = locationService.calculateDistance(cpDelhi, noidaSec18);
    // Real-world distance is ~12-14 km
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(16);
  });

  it('should compute route distance and travel ETA', async () => {
    const cpDelhi = { latitude: 28.6315, longitude: 77.2167 };
    const noidaSec18 = { latitude: 28.5708, longitude: 77.326 };

    const route = await locationService.getRoute(cpDelhi, noidaSec18);
    expect(route.distanceKm).toBeGreaterThan(0);
    expect(route.durationMinutes).toBeGreaterThan(0);
    expect(route.polyline).toBeDefined();
  });
});

describe('Multilingual Language Detector', () => {
  it('should detect Hindi for standard Devanagari text', () => {
    const lang = languageDetector.detectLanguage('मुझे एक अच्छा प्लंबर चाहिए');
    expect(lang).toBe('hi');
  });

  it('should detect Bhojpuri for Bhojpuri phrases', () => {
    const lang = languageDetector.detectLanguage('का हो हमके एगो मिस्त्री चाहीं');
    expect(lang).toBe('bho');
  });

  it('should detect English for Latin script queries', () => {
    const lang = languageDetector.detectLanguage('I need a certified electrician in Noida');
    expect(lang).toBe('en');
  });
});
