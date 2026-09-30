export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  origin: Coordinates;
  destination: Coordinates;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
}

export class LocationService {
  /**
   * Calculate great-circle distance between two points using the Haversine formula
   */
  calculateDistance(origin: Coordinates, destination: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(destination.latitude - origin.latitude);
    const dLon = this.deg2rad(destination.longitude - origin.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(origin.latitude)) *
        Math.cos(this.deg2rad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return parseFloat(d.toFixed(2));
  }

  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const distanceKm = this.calculateDistance(origin, destination);
    // Estimated urban driving speed ~25-30 km/h in Indian cities
    const estimatedMinutes = Math.max(5, Math.round((distanceKm / 28) * 60));

    return {
      origin,
      destination,
      distanceKm,
      durationMinutes: estimatedMinutes,
      polyline: `enc_route_${origin.latitude}_${origin.longitude}_to_${destination.latitude}_${destination.longitude}`,
    };
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
