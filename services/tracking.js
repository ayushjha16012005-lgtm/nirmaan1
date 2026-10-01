/* NIRMAAN Realtime GPS Tracking Service */
import { supabase, isLive } from "./supabase.js";

let activeWatchId = null;
let activePublishChannel = null;

function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const tracking = {
  // Subscribe to worker location updates (Customer view)
  subscribe(jobId, destCoords, onLocationUpdate) {
    if (isLive()) {
      const channel = supabase.channel(`job-loc:${jobId}`)
        .on("broadcast", { event: "loc" }, payload => {
          const loc = payload.payload;
          let distanceKm = 0;
          let etaMinutes = 2;

          if (destCoords && destCoords.lat && destCoords.lng) {
            distanceKm = computeDistanceKm(loc.lat, loc.lng, destCoords.lat, destCoords.lng);
            // Assume 25 km/h urban speed -> minutes = (distanceKm / 25) * 60
            etaMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
          }

          onLocationUpdate({
            ...loc,
            distance_km: distanceKm,
            eta_minutes: etaMinutes
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Demo Mode: Smooth simulated movement towards destination
    let lat = 28.6210;
    let lng = 77.3590;
    const destLat = destCoords?.lat || 28.6280;
    const destLng = destCoords?.lng || 77.3649;

    const interval = setInterval(() => {
      lat += (destLat - lat) * 0.1 + (Math.random() - 0.5) * 0.0001;
      lng += (destLng - lng) * 0.1 + (Math.random() - 0.5) * 0.0001;
      const dist = computeDistanceKm(lat, lng, destLat, destLng);
      const eta = Math.max(1, Math.round((dist / 25) * 60));

      onLocationUpdate({
        lat,
        lng,
        heading: 45,
        speed_kmh: 22,
        distance_km: dist,
        eta_minutes: eta,
        ts: Date.now()
      });
    }, 2500);

    return () => clearInterval(interval);
  },

  // Publish worker location (Worker phone view)
  startPublishing(jobId, onLocationSent, onPermissionDenied) {
    this.stopPublishing();

    if (!navigator.geolocation) {
      if (onPermissionDenied) onPermissionDenied("Geolocation is not supported by this device");
      return;
    }

    if (isLive()) {
      activePublishChannel = supabase.channel(`job-loc:${jobId}`);
      activePublishChannel.subscribe();
    }

    activeWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading || 0,
          speed_kmh: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 20,
          ts: Date.now()
        };

        if (isLive() && activePublishChannel) {
          activePublishChannel.send({
            type: "broadcast",
            event: "loc",
            payload: coords
          });
        }

        if (onLocationSent) onLocationSent(coords);
      },
      (err) => {
        console.warn("Geolocation watch error:", err);
        if (onPermissionDenied) onPermissionDenied(err.message || "Location permission denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      }
    );
  },

  stopPublishing() {
    if (activeWatchId !== null) {
      navigator.geolocation.clearWatch(activeWatchId);
      activeWatchId = null;
    }
    if (activePublishChannel) {
      supabase.removeChannel(activePublishChannel);
      activePublishChannel = null;
    }
  }
};
