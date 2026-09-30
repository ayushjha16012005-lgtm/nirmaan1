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
            ">
              ${w.avatar || "👨‍🔧"}
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker([w.lat, w.lng], { icon: customIcon }).addTo(map);
        marker.on("click", () => {
          if (onSelect) onSelect(w);
        });

        markers.push(marker);
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
      map.remove();
    }
  };
}
