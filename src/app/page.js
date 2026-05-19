"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import StatCard   from "@/components/StatCard";
import IssueModal from "@/components/IssueModal";
import {
  getDangerColor, getDangerLabel, getDangerBg, DANGER_LEVELS,
} from "@/lib/colorUtils";
import { findCityCoords } from "@/lib/cityCoords";

// Leaflet — client side only
const IndiaMap = dynamic(() => import("@/components/IndiaMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
          style={{ borderColor: "#1e3a5f", borderTopColor: "#f97316" }} />
        <p className="text-xs font-mono" style={{ color: "#2d4a6a" }}>Loading map…</p>
      </div>
    </div>
  ),
});

// ── Robust Days Pending reader ──────────────────────────────────────
function getDays(row) {
  const keys = ["Days Pending", "days pending", "Days pending", "DAYS PENDING"];
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return parseInt(row[k]) || 0;
  }
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().includes("days") && k.toLowerCase().includes("pending")) {
      return parseInt(row[k]) || 0;
    }
  }
  return 0;
}

export default function Dashboard() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedCity, setSelectedCity]   = useState(null);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [sidebarFilter, setSidebarFilter] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res  = await fetch("/api/sheets?" + Date.now());
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchData]);

  const cityData = useMemo(() => {
    const g = {};
    data.forEach((row) => {
      const city = (row["City"] || "").trim();
      if (!city) return;
      if (!g[city]) g[city] = [];
      g[city].push(row);
    });
    return g;
  }, [data]);

  const stats = useMemo(() => ({
    total:    data.length,
    critical: data.filter((r) => getDays(r) > 30).length,
    high:     data.filter((r) => { const d = getDays(r); return d > 15 && d <= 30; }).length,
    cities:   Object.keys(cityData).length,
  }), [data, cityData]);

  const sortedCities = useMemo(() => {
    let entries = Object.entries(cityData);

    if (sidebarFilter !== "all") {
      entries = entries.filter(([, issues]) => {
        const mx = Math.max(...issues.map(getDays));
        if (sidebarFilter === "critical") return mx > 30;
        if (sidebarFilter === "high")     return mx > 15 && mx <= 30;
        if (sidebarFilter === "medium")   return mx > 7  && mx <= 15;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([city]) => city.toLowerCase().includes(q));
    }

    return entries.sort(([, a], [, b]) => {
      const ma = Math.max(...a.map(getDays));
      const mb = Math.max(...b.map(getDays));
      return mb - ma;
    });
  }, [cityData, sidebarFilter, searchQuery]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#060b12", color: "#e2e8f0" }}>

      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: "#0f1d2e", background: "rgba(6,11,18,0.98)", zIndex: 1000 }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
              style={{ background: "linear-gradient(135deg,#1e3a5f,#0f1d2e)", color: "#f97316" }}>⬡</div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#2d4a6a" }}>Fleet Monitor</div>
              <div className="text-sm font-bold tracking-wide leading-tight">Vehicle Issue Tracker</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{ background: "#0a1525", border: "1px solid #0f2440" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            <span className="font-mono font-semibold" style={{ color: "#22c55e" }}>LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs">
            {[
              { n: stats.total,    label: "Total",    col: "#60a5fa" },
              { n: stats.critical, label: "Critical", col: "#f87171" },
              { n: stats.high,     label: "High",     col: "#fb923c" },
              { n: stats.cities,   label: "Cities",   col: "#a78bfa" },
            ].map(({ n, label, col }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: "#0a1525", border: "1px solid #0f2440" }}>
                <span className="font-mono font-bold" style={{ color: col }}>{n}</span>
                <span style={{ color: "#2d4a6a" }}>{label}</span>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <span className="text-[10px] font-mono hidden lg:block" style={{ color: "#1e3a5f" }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "#0a1525", border: "1px solid #1e3a5f", color: "#60a5fa", opacity: loading ? 0.5 : 1 }}>
            <span className={loading ? "animate-spin inline-block" : ""}>↻</span>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shrink-0"
          style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.35)", color: "#fc8181" }}>
          <span>⚠</span>
          <div>
            <div className="font-semibold mb-0.5">Data load failed</div>
            <div className="text-xs opacity-80">{error}</div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* MAP AREA */}
        <div className="flex-1 relative overflow-hidden">

          {/* Stat cards */}
          <div className="absolute top-4 left-4 z-[999] flex flex-wrap gap-2">
            <StatCard label="Total Issues"    value={stats.total}    color="blue"   icon="🔧" />
            <StatCard label="Critical 30d+"   value={stats.critical} color="red"    icon="🔴" />
            <StatCard label="High 15–30d"     value={stats.high}     color="orange" icon="🟠" />
            <StatCard label="Cities Affected" value={stats.cities}   color="yellow" icon="📍" />
          </div>

          {/* Legend */}
          <div className="absolute bottom-8 left-4 z-[999] rounded-xl px-4 py-3"
            style={{ background: "rgba(10,16,28,0.95)", border: "1px solid #0f2440", backdropFilter: "blur(12px)" }}>
            <div className="text-[9px] uppercase tracking-widest mb-2.5 font-semibold" style={{ color: "#2d4a6a" }}>
              Days Pending
            </div>
            {DANGER_LEVELS.map(({ label, sublabel, color }) => (
              <div key={label} className="flex items-center gap-2.5 mb-1.5 last:mb-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: color, boxShadow: `0 0 5px ${color}80` }} />
                <span className="text-[11px]" style={{ color: "#94a3b8" }}>{label}</span>
                <span className="text-[9px] font-mono font-bold" style={{ color }}>{sublabel}</span>
              </div>
            ))}
          </div>

          <IndiaMap cityData={cityData} onCityClick={setSelectedCity} selectedCity={selectedCity} />

          {loading && data.length === 0 && (
            <div className="absolute inset-0 z-[9999] flex items-center justify-center"
              style={{ background: "rgba(6,11,18,0.85)" }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin"
                  style={{ borderColor: "#1e3a5f", borderTopColor: "#f97316" }} />
                <div className="text-sm font-mono" style={{ color: "#4a6080" }}>Fetching fleet data…</div>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="w-72 flex flex-col border-l shrink-0"
          style={{ borderColor: "#0f1d2e", background: "rgba(8,12,20,0.97)" }}>

          <div className="px-4 py-3.5 border-b shrink-0" style={{ borderColor: "#0f2440" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#2d4a6a" }}>
                Issue Hotspots
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "#0f1d2e", color: "#4a6080" }}>
                {sortedCities.length} cities
              </span>
            </div>

            <input type="text" placeholder="Search city…" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg outline-none mb-3"
              style={{ background: "#0a1525", border: "1px solid #0f2440", color: "#e2e8f0" }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a5f")}
              onBlur={(e)  => (e.target.style.borderColor = "#0f2440")}
            />

            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: "all",      label: "All",      col: "#60a5fa" },
                { key: "critical", label: "Critical", col: "#f87171" },
                { key: "high",     label: "High",     col: "#fb923c" },
                { key: "medium",   label: "Medium",   col: "#fbbf24" },
              ].map(({ key, label, col }) => (
                <button key={key} onClick={() => setSidebarFilter(key)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono transition-all"
                  style={sidebarFilter === key
                    ? { background: col + "20", border: `1px solid ${col}50`, color: col }
                    : { background: "#0a1525", border: "1px solid #0f2440", color: "#2d4a6a" }
                  }>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedCities.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-xs" style={{ color: "#2d4a6a" }}>
                {data.length === 0 ? "No data. Check sheet access." : "No cities match filter."}
              </div>
            )}

            {sortedCities.map(([city, issues]) => {
              const maxDays    = Math.max(...issues.map(getDays));
              const color      = getDangerColor(maxDays);
              const isSelected = selectedCity === city;
              const hasMapped  = !!findCityCoords(city);

              return (
                <button key={city} onClick={() => setSelectedCity(city)}
                  className="w-full text-left px-4 py-3.5 border-b transition-all"
                  style={{
                    borderColor: "#0a1525",
                    background:  isSelected ? getDangerBg(maxDays) : "transparent",
                    borderLeft:  isSelected ? `3px solid ${color}` : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(15,29,46,0.5)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: color, boxShadow: maxDays > 30 ? `0 0 5px ${color}` : "none" }} />
                      <span className="font-semibold text-sm" style={{ color: isSelected ? "#e2e8f0" : "#b0c4d8" }}>
                        {city}
                      </span>
                      {!hasMapped && (
                        <span className="text-[9px] px-1 rounded"
                          style={{ background: "#0f1d2e", color: "#2d4a6a" }} title="Not on map">?</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color + "20", color, border: `1px solid ${color}40` }}>
                      {issues.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wide" style={{ color }}>
                      {getDangerLabel(maxDays)}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "#2d4a6a" }}>{maxDays}d max</span>
                  </div>

                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "#0a1525" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${Math.min((maxDays / 300) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${color}50, ${color})`,
                      }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "#0f2440" }}>
            <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#1a2d4e" }}>
              Auto-refresh every 5 min
            </div>
          </div>
        </div>
      </div>

      {selectedCity && cityData[selectedCity] && (
        <IssueModal city={selectedCity} issues={cityData[selectedCity]}
          onClose={() => setSelectedCity(null)} />
      )}
    </div>
  );
}
