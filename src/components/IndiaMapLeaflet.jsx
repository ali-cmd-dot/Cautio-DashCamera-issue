"use client";

import { useEffect, useRef } from "react";
import { findCityCoords } from "@/lib/cityCoords";
import { getDangerColor, getDangerGlow, getDangerLabel, getPinSize } from "@/lib/colorUtils";

function getDays(row) {
  for (const k of Object.keys(row)) {
    const clean = k.toLowerCase().replace(/[^a-z]/g, "");
    if (clean === "dayspending" || clean === "daypending") {
      return parseInt(row[k].toString().replace(/[^0-9]/g, "")) || 0;
    }
  }
  for (const k of Object.keys(row)) {
    const kl = k.toLowerCase();
    if (kl.includes("day") && kl.includes("pend")) {
      return parseInt(row[k].toString().replace(/[^0-9]/g, "")) || 0;
    }
  }
  return 0;
}

export default function IndiaMapLeaflet({ cityData, onCityClick, selectedCity }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const initRef      = useRef(false);

  // Init map once
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Add Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link    = document.createElement("link");
        link.id       = "leaflet-css";
        link.rel      = "stylesheet";
        link.href     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        await new Promise(r => setTimeout(r, 100));
      }

      if (mapRef.current) return;

      // Fix container height explicitly
      containerRef.current.style.height = "100%";
      containerRef.current.style.width  = "100%";

      const map = L.map(containerRef.current, {
        center:           [22.5, 78.9629],   // Center of India
        zoom:             5,
        zoomControl:      true,
        attributionControl: false,
        minZoom:          4,
        maxZoom:          12,
        // Lock to India bounds
        maxBounds:        [[6, 60], [40, 100]],
        maxBoundsViscosity: 0.8,
      });

      // Dark green tile — CartoDB Dark Matter
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Green tint overlay
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19, opacity: 0.0 }
      ).addTo(map);

      mapRef.current = map;

      // Force size recalculation
      setTimeout(() => map.invalidateSize(), 200);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        initRef.current   = false;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) {
      const retry = setInterval(() => {
        if (mapRef.current) {
          clearInterval(retry);
          updateMarkers();
        }
      }, 200);
      return () => clearInterval(retry);
    }
    updateMarkers();

    async function updateMarkers() {
      const L   = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      // Clear old markers
      Object.values(markersRef.current).forEach(m => { try { m.remove(); } catch(e) {} });
      markersRef.current = {};

      Object.entries(cityData).forEach(([city, issues]) => {
        const coords = findCityCoords(city);
        if (!coords) return;

        const maxDays    = Math.max(...issues.map(getDays));
        const color      = getDangerColor(maxDays);
        const glow       = getDangerGlow(maxDays);
        const size       = getPinSize(issues.length);
        const isCritical = maxDays > 30;
        const isSelected = selectedCity === city;

        // Outer pulse ring for critical
        if (isCritical) {
          const ring = L.circleMarker(coords, {
            radius: size + 12, color, fillColor: color,
            fillOpacity: 0.07, weight: 1, opacity: 0.3, interactive: false,
          }).addTo(map);
          markersRef.current[`${city}_ring`] = ring;
        }

        // Main marker
        const marker = L.circleMarker(coords, {
          radius:      size,
          color:       isSelected ? "#ffffff" : color,
          weight:      isSelected ? 3 : 1.5,
          fillColor:   color,
          fillOpacity: 0.85,
        }).addTo(map);

        // Hover tooltip
        marker.bindTooltip(
          `<div style="
            background:#081508;
            border:1px solid ${color}55;
            border-radius:10px;
            padding:10px 14px;
            color:#e2f5e8;
            font-family:Inter,sans-serif;
            min-width:155px;
            box-shadow:0 4px 24px rgba(0,0,0,0.6),0 0 20px ${color}15;
          ">
            <div style="font-weight:700;font-size:13px;margin-bottom:5px;display:flex;align-items:center;gap:6px">
              <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 6px ${color}"></span>
              ${city}
            </div>
            <div style="font-size:11px;color:#4a7a5a;margin-bottom:5px">
              ${issues.length} unresolved issue${issues.length !== 1 ? "s" : ""}
            </div>
            <div style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.05em">
              ${getDangerLabel(maxDays)} · ${maxDays}d
            </div>
          </div>`,
          { permanent: false, direction: "top", offset: [0, -size - 4], opacity: 1, className: "leaflet-tooltip-cautio" }
        );

        // Count label
        if (issues.length > 0) {
          const icon = L.divIcon({
            html: `<div style="
              color:rgba(255,255,255,0.95);
              font-size:${Math.max(Math.floor(size * 0.75), 7)}px;
              font-weight:800;
              font-family:'JetBrains Mono',monospace;
              text-align:center;
              line-height:1;
              pointer-events:none;
              text-shadow:0 1px 3px rgba(0,0,0,0.8);
            ">${issues.length}</div>`,
            className:  "",
            iconSize:   [size * 2, size * 2],
            iconAnchor: [size, size],
          });
          const lbl = L.marker(coords, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
          markersRef.current[`${city}_lbl`] = lbl;
        }

        marker.on("click", () => onCityClick(city));
        markersRef.current[city] = marker;
      });
    }
  }, [cityData, selectedCity, onCityClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "400px" }} />
    </div>
  );
}
