/* NIRMAAN Leaflet Map Component */
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function createMap(el, options = {}) {
  const defaultCenter = [28.6280, 77.3649]; // Noida Center
  const defaultZoom = options.zoom || 13;

  const map = L.map(el, {
    center: options.center || defaultCenter,
    zoom: defaultZoom,
    zoomControl: false
  });

  L.control.zoom({ position: "bottomright" }).addTo(map);

  // OpenStreetMap Tile Layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let markers = [];
  let routePolyline = null;
  let workerMarker = null;
  let radiusCircle = null;
  let userLocationMarker = null;

  return {
    mapInstance: map,

    addKaarigarMarkers(workers, onSelect) {
      // Clear old markers
      markers.forEach(m => map.removeLayer(m));
      markers = [];

      workers.forEach(w => {
        if (!w.lat || !w.lng) return;

        const customIcon = L.divIcon({
          className: "kaarigar-map-pin",
          html: `
            <div style="
              width: 38px; height: 38px; border-radius: 50%;
              background: var(--saffron); color: white;
              border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center;
              font-size: 1.2rem; cursor: pointer; transform: translate(-50%, -50%);
              transition: transform 0.2s ease;
            ">
              ${w.avatar || "👨‍🔧"}
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker([w.lat, w.lng], { icon: customIcon }).addTo(map);
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 12px; color: #18191B;">${w.name}</div>
          <div style="font-size: 11px; color: #666;">${w.headline || w.trade_label || "Kaarigar"}</div>
          <div style="font-size: 11px; font-weight: 700; color: #E8621A;">₹${w.rate}/${w.rate_type || "day"} • ★ ${w.rating_avg || 4.8}</div>
        `, {
          direction: "top",
          offset: [0, -18],
          opacity: 0.95
        });

        marker.on("click", () => {
          if (onSelect) onSelect(w);
        });

        markers.push(marker);
      });
    },

    setUserLocation(lat, lng) {
      if (userLocationMarker) map.removeLayer(userLocationMarker);

      const userIcon = L.divIcon({
        className: "user-location-pin",
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="
              width: 22px; height: 22px; border-radius: 50%;
              background: #2D6A4F; border: 3px solid white;
              box-shadow: 0 0 14px rgba(45,106,79,0.9);
            "></div>
            <div style="
              position: absolute; top: -5px; left: -5px; width: 32px; height: 32px; border-radius: 50%;
              border: 2px solid #2D6A4F; opacity: 0.6;
              animation: leafletPulse 2s infinite ease-out;
              pointer-events: none;
            "></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userLocationMarker.bindTooltip(`<div style="font-weight:700; font-size:12px; color:#2D6A4F;">📍 Your Location (आपका स्थान)</div>`, {
        direction: "top",
        offset: [0, -12],
        opacity: 0.95
      });
    },

    // Compress & expand map to fit selected radius circle
    setRadius(centerLat, centerLng, radiusKm) {
      if (radiusCircle) {
        map.removeLayer(radiusCircle);
      }

      radiusCircle = L.circle([centerLat, centerLng], {
        radius: radiusKm * 1000,
        color: "#E8621A",
        weight: 2,
        dashArray: "6, 6",
        fillColor: "#E8621A",
        fillOpacity: 0.08
      }).addTo(map);

      // Smoothly fly and adjust bounds to radius (compress for 2km, expand for 5km/10km/25km)
      map.flyToBounds(radiusCircle.getBounds(), {
        padding: [24, 24],
        maxZoom: 16,
        duration: 0.8,
        easeLinearity: 0.25
      });
    },

    setCenter(lat, lng, zoom = 14) {
      map.setView([lat, lng], zoom);
    },

    drawTrackingRoute(startLat, startLng, destLat, destLng, workerLat, workerLng) {
      if (routePolyline) map.removeLayer(routePolyline);
      if (workerMarker) map.removeLayer(workerMarker);

      // Draw dashed route line
      const latlngs = [
        [startLat, startLng],
        [destLat, destLng]
      ];

      routePolyline = L.polyline(latlngs, {
        color: "#E8621A",
        weight: 4,
        dashArray: "8, 8",
        opacity: 0.85
      }).addTo(map);

      // Worker Live Icon
      const workerIcon = L.divIcon({
        className: "worker-live-pin",
        html: `
          <div style="
            width: 44px; height: 44px; border-radius: 50%;
            background: linear-gradient(135deg, #FF8A50, #E8621A);
            color: white; border: 3px solid white;
            box-shadow: 0 0 20px rgba(232,98,26,0.6);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; animation: nirmaanPulse 1.5s infinite;
          ">
            🛵
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      workerMarker = L.marker([workerLat || startLat, workerLng || startLng], { icon: workerIcon }).addTo(map);

      // Destination Pin
      const destIcon = L.divIcon({
        className: "dest-pin",
        html: `
          <div style="
            width: 36px; height: 36px; border-radius: 50%;
            background: #2D6A4F; color: white;
            border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
          ">
            🏠
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    },

    updateWorkerPos(lat, lng) {
      if (workerMarker) {
        workerMarker.setLatLng([lat, lng]);
      }
    },

    destroy() {
      if (radiusCircle) map.removeLayer(radiusCircle);
      if (userLocationMarker) map.removeLayer(userLocationMarker);
      markers.forEach(m => map.removeLayer(m));
      map.remove();
    }
  };
}
