"use client";

import { useEffect, useRef, useState } from "react";

export default function VisitorsMap({ cities }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [coords, setCoords] = useState({});

  useEffect(() => {
    if (!cities?.length) return;
    const toGeocode = cities.filter((c) => c.x && !coords[c.x]);
    if (toGeocode.length === 0) return;

    fetch("/api/admin/analytics/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cities: toGeocode.map((c) => ({ name: c.x, country: c.country || "" })),
      }),
    })
      .then((r) => r.json())
      .then((data) => setCoords((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, [cities]);

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
    if (!mapInstance.current || !cities?.length) return;
    const L = require("leaflet");
    const map = mapInstance.current;

    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    const maxCount = cities[0]?.y || 1;

    for (const city of cities) {
      const c = coords[city.x];
      if (!c) continue;

      const radius = Math.max(6, Math.min(26, (city.y / maxCount) * 26));

      const marker = L.circleMarker(c, {
        radius,
        fillColor: "#3b82f6",
        fillOpacity: 0.6,
        color: "#60a5fa",
        weight: 1.5,
      })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;min-width:100px">` +
          `<strong>${city.x}</strong>${city.country ? ` (${city.country})` : ""}<br>` +
          `<span style="font-size:18px;font-weight:700;color:#3b82f6">${city.y}</span> ` +
          `<span style="color:#888">${city.y === 1 ? "odwiedzający" : "odwiedzających"}</span>` +
          `</div>`,
          { closeButton: false }
        )
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [cities, coords]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div ref={mapRef} style={{ height: 360, width: "100%", background: "#0a0f1a" }} />
    </div>
  );
}
