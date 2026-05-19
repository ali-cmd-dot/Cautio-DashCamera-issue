"use client";

import { useState, useRef, useCallback } from "react";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from "react-simple-maps";
import { findCityCoords } from "@/lib/cityCoords";
import { getDangerColor, getDangerGlow, getDangerLabel, getPinSize } from "@/lib/colorUtils";

const GEO_URL =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

export default function IndiaMap({ cityData, onCityClick, selectedCity }) {
  const [tooltip, setTooltip]   = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom]         = useState(1);
  const containerRef            = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const unknownCities = Object.keys(cityData).filter((c) => !findCityCoords(c));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full map-grid overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
        {[
          { label: "+", fn: () => setZoom((z) => Math.min(z * 1.5, 8)) },
          { label: "⊙", fn: () => setZoom(1) },
          { label: "−", fn: () => setZoom((z) => Math.max(z / 1.5, 0.8)) },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="w-8 h-8 flex items-center justify-center text-sm font-mono rounded transition-colors"
            style={{ background: "rgba(13,21,37,0.9)", border: "1px solid #1e3a5f", color: "#94a3b8" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-xl px-4 py-3 shadow-2xl"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y - 70,
            background: "rgba(13,21,37,0.97)",
            border: `1px solid ${getDangerColor(tooltip.maxDays)}55`,
            minWidth: "160px",
          }}
        >
          <div className="font-bold text-white text-sm mb-1">📍 {tooltip.city}</div>
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: "#64748b" }}>
              {tooltip.count} issue{tooltip.count !== 1 ? "s" : ""}
            </span>
            <span
              className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white"
              style={{ background: getDangerColor(tooltip.maxDays) }}
            >
              {getDangerLabel(tooltip.maxDays)}
            </span>
          </div>
          <div className="text-xs mt-1 font-mono" style={{ color: getDangerColor(tooltip.maxDays) }}>
            Max: {tooltip.maxDays}d pending
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1060, center: [82.5, 22.5] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          onMoveEnd={({ zoom: z }) => setZoom(z)}
          minZoom={0.8}
          maxZoom={8}
        >
          {/* Ocean background */}
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="#060b12" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#0f1d30"
                  stroke="#1a3354"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none" },
                    hover:   { fill: "#162840", outline: "none", cursor: "default" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* City pins */}
          {Object.entries(cityData).map(([city, issues]) => {
            const coords = findCityCoords(city);
            if (!coords) return null;

            const maxDays    = Math.max(...issues.map((i) => parseInt(i["Days Pending"]) || 0));
            const color      = getDangerColor(maxDays);
            const glow       = getDangerGlow(maxDays);
            const size       = getPinSize(issues.length);
            const isSelected = selectedCity === city;
            const isCritical = maxDays > 30;

            return (
              <Marker
                key={city}
                coordinates={coords}
                onClick={() => onCityClick(city)}
                onMouseEnter={() => setTooltip({ city, count: issues.length, maxDays })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Ambient glow rings for critical */}
                {isCritical && (
                  <>
                    <circle r={size + 14} fill={color} opacity={0.06} pointerEvents="none" />
                    <circle r={size + 8}  fill={color} opacity={0.12} pointerEvents="none" />
                  </>
                )}
                {/* Selection ring */}
                {isSelected && (
                  <circle r={size + 5} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.6} pointerEvents="none" />
                )}
                {/* Soft glow base */}
                <circle r={size + 3} fill={color} opacity={0.2} pointerEvents="none" />
                {/* Main pin */}
                <circle
                  r={size}
                  fill={color}
                  fillOpacity={0.9}
                  stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.15)"}
                  strokeWidth={isSelected ? 2 : 0.5}
                  style={{
                    cursor: "pointer",
                    filter: `drop-shadow(0 0 ${isCritical ? 8 : 4}px ${glow})`,
                  }}
                />
                {/* Count label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.95)"
                  fontSize={size > 10 ? size * 0.75 : 6}
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                  pointerEvents="none"
                >
                  {issues.length}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Unknown cities */}
      {unknownCities.length > 0 && (
        <div
          className="absolute bottom-14 right-4 text-xs rounded-lg px-3 py-2 max-w-[200px]"
          style={{ background: "rgba(13,21,37,0.9)", border: "1px solid #1e3a5f", color: "#4a6080" }}
        >
          <div className="font-semibold mb-1">⚠ Not mapped:</div>
          {unknownCities.map((c) => <div key={c}>{c}</div>)}
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-xs" style={{ color: "#1e3a5f" }}>
        Scroll to zoom · Click pin for details
      </div>
    </div>
  );
}
