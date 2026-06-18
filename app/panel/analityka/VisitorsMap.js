"use client";

import { useEffect, useRef, useState } from "react";

const CITY_COORDS = {
  "Szczecin": [53.4285, 14.5528],
  "Warszawa": [52.2297, 21.0122],
  "Kraków": [50.0647, 19.9450],
  "Wrocław": [51.1079, 17.0385],
  "Poznań": [52.4064, 16.9252],
  "Poznan": [52.4064, 16.9252],
  "Gdańsk": [54.3520, 18.6466],
  "Gdansk": [54.3520, 18.6466],
  "Łódź": [51.7592, 19.4560],
  "Katowice": [50.2649, 19.0238],
  "Lublin": [51.2465, 22.5684],
  "Białystok": [53.1325, 23.1688],
  "Bydgoszcz": [53.1235, 18.0084],
  "Toruń": [53.0138, 18.5984],
  "Rzeszów": [50.0412, 21.9991],
  "Opole": [50.6751, 17.9213],
  "Kielce": [50.8661, 20.6286],
  "Olsztyn": [53.7784, 20.4801],
  "Zielona Góra": [51.9356, 15.5062],
  "Gorzów Wielkopolski": [52.7325, 15.2369],
  "Koszalin": [54.1943, 16.1715],
  "Drawno": [53.2167, 15.7167],
  "Choszczno": [53.1700, 15.4100],
  "Sowno": [53.3500, 14.7500],
  "Stargard": [53.3365, 15.0490],
  "Myślibórz": [52.9236, 14.8631],
  "Dębno": [52.7372, 14.6897],
  "Berlin": [52.5200, 13.4050],
  "Wismar": [53.8913, 11.4652],
  "Hamburg": [53.5511, 9.9937],
  "München": [48.1351, 11.5820],
  "London": [51.5074, -0.1278],
  "Paris": [48.8566, 2.3522],
  "Amsterdam": [52.3676, 4.9041],
  "Praha": [50.0755, 14.4378],
  "Stockholm": [59.3293, 18.0686],
  "Oslo": [59.9139, 10.7522],
  "Kyiv": [50.4504, 30.5245],
};

export default function VisitorsMap({ cities }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [52.5, 17],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 16,
      }).addTo(map);

      mapInstance.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapInstance.current || !cities?.length) return;
    const L = require("leaflet");
    const map = mapInstance.current;

    map.eachLayer((l) => { if (l instanceof L.CircleMarker) map.removeLayer(l); });

    const maxCount = cities[0]?.y || 1;

    for (const city of cities) {
      const name = city.x;
      const coords = CITY_COORDS[name];
      if (!coords) continue;

      const radius = Math.max(6, Math.min(24, (city.y / maxCount) * 24));

      L.circleMarker(coords, {
        radius,
        fillColor: "#3b82f6",
        fillOpacity: 0.6,
        color: "#60a5fa",
        weight: 1.5,
      })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;min-width:100px">` +
          `<strong>${name}</strong>${city.country ? ` (${city.country})` : ""}<br>` +
          `<span style="font-size:18px;font-weight:700;color:#3b82f6">${city.y}</span> ` +
          `<span style="color:#888">${city.y === 1 ? "odwiedzający" : "odwiedzających"}</span>` +
          `</div>`,
          { closeButton: false }
        )
        .addTo(map);
    }
  }, [ready, cities]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div ref={mapRef} style={{ height: 360, width: "100%", background: "#0a0f1a" }} />
    </div>
  );
}
