/* NIRMAAN Realtime GPS & Spatial Tracking Service */
import { supabase, isLive } from "./supabase.js";

export const tracking = {
  subscribe(jobId, onLocationUpdate) {
    if (isLive()) {
      const channel = supabase.channel(`job:${jobId}`)
        .on("broadcast", { event: "loc" }, payload => {
          onLocationUpdate(payload.payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Demo Mode: Smooth simulated movement towards destination
    let lat = 28.6210;
    let lng = 77.3590;
    const destLat = 28.6280;
    const destLng = 77.3649;

    const interval = setInterval(() => {
      lat += (destLat - lat) * 0.08 + (Math.random() - 0.5) * 0.0002;
      lng += (destLng - lng) * 0.08 + (Math.random() - 0.5) * 0.0002;

      onLocationUpdate({
        lat,
        lng,
        heading: 45,
        speed_kmh: 22,
        eta_minutes: Math.max(1, Math.round(Math.abs(destLat - lat) * 1000)),
        ts: Date.now()
      });
    }, 2500);

    return () => clearInterval(interval);
  },

  publishLocation(jobId, coords) {
    if (isLive()) {
      const channel = supabase.channel(`job:${jobId}`);
      channel.send({
        type: "broadcast",
        event: "loc",
        payload: {
          lat: coords.lat,
          lng: coords.lng,
          heading: coords.heading || 0,
          ts: Date.now()
        }
      });
    }
  }
};
