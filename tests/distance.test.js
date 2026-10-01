import test from "node:test";
import assert from "node:assert";

function computeHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function computeETA(distanceKm, speedKmh = 25) {
  if (distanceKm <= 0) return 1;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

test("Haversine distance between identical coordinates is 0 km", () => {
  const d = computeHaversineDistanceKm(28.6280, 77.3649, 28.6280, 77.3649);
  assert.strictEqual(d, 0);
});

test("Haversine distance calculates accurate NCR distances", () => {
  // Noida Sector 62 (28.6280, 77.3649) to Connaught Place (28.6315, 77.2167)
  const dist = computeHaversineDistanceKm(28.6280, 77.3649, 28.6315, 77.2167);
  // Real straight-line distance is ~14.5 km
  assert.ok(dist >= 14 && dist <= 15, `Expected ~14.5km, got ${dist}km`);
});

test("ETA calculation reflects believable 25 km/h urban NCR traffic", () => {
  // 5 km at 25 km/h = 12 minutes
  const eta5km = computeETA(5, 25);
  assert.strictEqual(eta5km, 12);

  // 1 km at 25 km/h = ~2.4 -> 2 minutes
  const eta1km = computeETA(1, 25);
  assert.strictEqual(eta1km, 2);

  // 0 km gives minimum 1 minute
  const eta0km = computeETA(0, 25);
  assert.strictEqual(eta0km, 1);
});
