"use client";

import { useEffect, useRef } from "react";
import { findCityCoords } from "@/lib/cityCoords";
import { getDangerColor, getDangerGlow, getDangerLabel, getPinSize } from "@/lib/colorUtils";

export default function IndiaMapLeaflet({ cityData, onCityClick, selectedCity }) {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markersRef   = useRef({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamically import Leaflet (SSR safe)
    import("leaflet").then((L) => {
      // Import CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapRef.current || mapInstance.current) return;

      // Init map centered on India
      const map = L.map(mapRef.current, {
        center: [22.5, 82.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 12,
      });

      // Dark CartoDB tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers when cityData changes
  useEffect(() => {
    if (!mapInstance.current) return;

    import("leaflet").then((L) => {
      const map = mapInstance.current;

      // Remove old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      Object.entries(cityData).forEach(([city, issues]) => {
        const coords = findCityCoords(city);
        if (!coords) return;

        const maxDays    = Math.max(...issues.map((i) => getDays(i)));
        const color      = getDangerColor(maxDays);
        const size       = getPinSize(issues.length);
        const isCritical = maxDays > 30;
        const isSelected = selectedCity === city;

        // Outer glow circle for critical
        if (isCritical) {
          const glow = L.circleMarker(coords, {
            radius:      size + 10,
            color:       color,
            fillColor:   color,
            fillOpacity: 0.08,
            weight:      0,
            interactive: false,
          }).addTo(map);

          if (!markersRef.current[`${city}_glow`]) {
            markersRef.current[`${city}_glow`] = glow;
          }
        }

        // Main circle marker
        const marker = L.circleMarker(coords, {
          radius:      size,
          color:       isSelected ? "#ffffff" : color,
          weight:      isSelected ? 2.5 : 1,
          fillColor:   color,
          fillOpacity: 0.88,
        }).addTo(map);

        // Tooltip (hover)
        marker.bindTooltip(
          `<div style="
            background:#0d1525;
            border:1px solid ${color}55;
            border-radius:10px;
            padding:10px 14px;
            color:#e2e8f0;
            font-family:DM Sans,sans-serif;
            min-width:150px;
            box-shadow:0 4px 20px rgba(0,0,0,0.5)
          ">
            <div style="font-weight:700;font-size:13px;margin-bottom:5px">📍 ${city}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:3px">
              ${issues.length} issue${issues.length !== 1 ? "s" : ""}
            </div>
            <div style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;margin-bottom:3px">
              ${getDangerLabel(maxDays)}
            </div>
            <div style="font-size:11px;color:${color};font-family:monospace">
              Max: ${maxDays}d pending
            </div>
          </div>`,
          {
            permanent:   false,
            direction:   "top",
            offset:      [0, -size - 4],
            opacity:     1,
            className:   "leaflet-tooltip-dark",
          }
        );

        // Count label on marker
        const icon = L.divIcon({
          html: `<div style="
            width:${size * 2}px;
            height:${size * 2}px;
            display:flex;
            align-items:center;
            justify-content:center;
            color:rgba(255,255,255,0.95);
            font-size:${Math.max(size * 0.75, 8)}px;
            font-weight:700;
            font-family:'JetBrains Mono',monospace;
            pointer-events:none;
            margin-top:-${size}px;
            margin-left:-${size}px;
          ">${issues.length > 1 ? issues.length : ""}</div>`,
          className:   "",
          iconSize:    [0, 0],
          iconAnchor:  [0, 0],
        });

        const labelMarker = L.marker(coords, { icon, interactive: false }).addTo(map);

        marker.on("click", () => onCityClick(city));

        markersRef.current[city]              = marker;
        markersRef.current[`${city}_label`]  = labelMarker;
      });
    });
  }, [cityData, selectedCity, onCityClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Custom tooltip CSS */}
      <style>{`
        .leaflet-tooltip-dark {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-dark::before { display: none !important; }
        .leaflet-control-zoom {
          border: 1px solid #1e3a5f !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(13,21,37,0.95) !important;
          color: #94a3b8 !important;
          border-color: #1e3a5f !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1e3a5f !important;
          color: #e2e8f0 !important;
        }
        .leaflet-container {
          background: #060b12 !important;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
    </div>
  );
}

// Helper — Days Pending column robust read
function getDays(row) {
  // Try multiple possible column names
  const keys = ["Days Pending", "days pending", "Days pending", "DAYS PENDING", "DaysPending"];
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return parseInt(row[k]) || 0;
  }
  // Fallback: find any key containing "days" and "pending"
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().includes("days") && k.toLowerCase().includes("pending")) {
      return parseInt(row[k]) || 0;
    }
  }
  return 0;
}
