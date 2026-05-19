"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import StatCard   from "@/components/StatCard";
import IssueModal from "@/components/IssueModal";
import { getDangerColor, getDangerLabel, getDangerBg, DANGER_LEVELS } from "@/lib/colorUtils";
import { findCityCoords } from "@/lib/cityCoords";

const IndiaMap = dynamic(() => import("@/components/IndiaMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#050d05" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
          style={{ borderColor: "#1a3320", borderTopColor: "#4ade80" }} />
        <p className="text-xs font-mono" style={{ color: "#3a6a4a" }}>Initialising map…</p>
      </div>
    </div>
  ),
});

function getDays(row) {
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().replace(/\s+/g," ").trim() === "days pending") return parseInt(row[k]) || 0;
  }
  return 0;
}

const NAV_TABS = ["Overview", "Alerts", "Issues", "Cities", "Device Movement"];

export default function Dashboard() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedCity, setSelectedCity]   = useState(null);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [sidebarFilter, setSidebarFilter] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeTab, setActiveTab]         = useState("Overview");

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
    data.forEach(row => {
      const city = (row["City"] || "").trim();
      if (!city) return;
      if (!g[city]) g[city] = [];
      g[city].push(row);
    });
    return g;
  }, [data]);

  const stats = useMemo(() => ({
    total:    data.length,
    critical: data.filter(r => getDays(r) > 30).length,
    high:     data.filter(r => { const d=getDays(r); return d>15&&d<=30; }).length,
    avgDays:  data.length
      ? Math.round(data.reduce((s,r) => s+getDays(r), 0) / data.length)
      : 0,
    cities:   Object.keys(cityData).length,
  }), [data, cityData]);

  const sortedCities = useMemo(() => {
    let entries = Object.entries(cityData);
    if (sidebarFilter !== "all") {
      entries = entries.filter(([, iss]) => {
        const mx = Math.max(...iss.map(getDays));
        if (sidebarFilter === "critical") return mx > 30;
        if (sidebarFilter === "high")     return mx > 15 && mx <= 30;
        if (sidebarFilter === "medium")   return mx > 7  && mx <= 15;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([c]) => c.toLowerCase().includes(q));
    }
    return entries.sort(([,a],[,b]) => Math.max(...b.map(getDays)) - Math.max(...a.map(getDays)));
  }, [cityData, sidebarFilter, searchQuery]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#050d05", color: "#e2f5e8" }}>

      {/* ── TOPBAR ── */}
      <header className="shrink-0 border-b" style={{ borderColor: "#1a3320", background: "#040a04", zIndex: 1000 }}>
        {/* Top strip */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: "#0f2015" }}>
          <div className="flex items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: "linear-gradient(135deg,#166534,#052e16)", border: "1px solid #1a4a2a", color: "#4ade80" }}>
                C
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight" style={{ color: "#e2f5e8" }}>Cautio</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest live-pulse"
                    style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
                    LIVE
                  </span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] leading-none mt-0.5" style={{ color: "#3a6a4a" }}>
                  Fleet Intelligence · Command Center
                </div>
              </div>
            </div>
          </div>

          {/* Right: stats + time */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#4ade80" }}>
                Real-Time Fleet Analytics
              </div>
              <div className="text-[9px]" style={{ color: "#2a4a3a" }}>
                AI-powered dashcams · Bharat's safest fleets
              </div>
            </div>

            {lastUpdated && (
              <div className="text-[10px] font-mono px-2.5 py-1 rounded"
                style={{ background: "#0a1a0a", border: "1px solid #1a3320", color: "#3a6a4a" }}>
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}

            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", opacity: loading?0.5:1 }}
              onMouseEnter={e => (e.currentTarget.style.background="rgba(74,222,128,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background="rgba(74,222,128,0.08)")}>
              <span className={loading?"animate-spin inline-block":""}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-0 px-4">
          {NAV_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-xs font-semibold tracking-wide transition-all relative"
              style={{ color: activeTab===tab ? "#4ade80" : "#3a6a4a" }}
              onMouseEnter={e => { if(activeTab!==tab) e.currentTarget.style.color="#6a9a7a"; }}
              onMouseLeave={e => { if(activeTab!==tab) e.currentTarget.style.color="#3a6a4a"; }}>
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── ERROR ── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shrink-0"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          <span>⚠</span>
          <div>
            <div className="font-semibold mb-0.5">Data load failed</div>
            <div className="text-xs opacity-70">{error}</div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 relative overflow-hidden cmd-grid">

          {/* Stat cards */}
          <div className="absolute top-4 left-4 z-[999] flex flex-wrap gap-2">
            <StatCard label="Offline Vehicles" value={stats.total}    color="green"  icon="🚗" />
            <StatCard label="Critical 30d+"    value={stats.critical} color="red"    icon="🔴" />
            <StatCard label="High 15–30d"      value={stats.high}     color="orange" icon="🟠" />
            <StatCard label="Avg Days Pending" value={`${stats.avgDays}d`} color="yellow" icon="⏱" />
            <StatCard label="Cities Affected"  value={stats.cities}   color="blue"   icon="📍" />
          </div>

          {/* Legend */}
          <div className="absolute bottom-8 left-4 z-[999] rounded-xl px-4 py-3"
            style={{ background: "rgba(5,13,5,0.95)", border: "1px solid #1a3320", backdropFilter: "blur(16px)" }}>
            <div className="text-[9px] uppercase tracking-widest mb-2.5 font-bold" style={{ color: "#2a4a3a" }}>
              ◈ Days Pending
            </div>
            {DANGER_LEVELS.map(({ label, sublabel, color }) => (
              <div key={label} className="flex items-center gap-2.5 mb-1.5 last:mb-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow:`0 0 4px ${color}` }} />
                <span className="text-[10px]" style={{ color: "#4a7a5a" }}>{label}</span>
                <span className="text-[9px] font-mono font-bold" style={{ color }}>{sublabel}</span>
              </div>
            ))}
          </div>

          <IndiaMap cityData={cityData} onCityClick={setSelectedCity} selectedCity={selectedCity} />

          {loading && data.length === 0 && (
            <div className="absolute inset-0 z-[9999] flex items-center justify-center"
              style={{ background: "rgba(5,13,5,0.9)" }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin"
                  style={{ borderColor: "#1a3320", borderTopColor: "#4ade80" }} />
                <div className="text-sm font-mono" style={{ color: "#3a6a4a" }}>Fetching fleet data…</div>
                <div className="text-xs mt-1" style={{ color: "#1a3320" }}>Cautio Command Center</div>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="w-72 flex flex-col border-l shrink-0"
          style={{ borderColor: "#1a3320", background: "#040a04" }}>

          <div className="px-4 py-3.5 border-b shrink-0" style={{ borderColor: "#0f2015" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#2a4a3a" }}>
                ◈ Issue Hotspots
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: "#0a1a0a", border: "1px solid #1a3320", color: "#3a6a4a" }}>
                {sortedCities.length} cities
              </span>
            </div>

            <div className="relative mb-3">
              <input type="text" placeholder="Search city…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg outline-none"
                style={{ background: "#0a1a0a", border: "1px solid #1a3320", color: "#e2f5e8", fontFamily:"Inter,sans-serif" }}
                onFocus={e  => (e.target.style.borderColor="#4ade80")}
                onBlur={e   => (e.target.style.borderColor="#1a3320")}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "#2a4a3a" }}>✕</button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {[
                { key:"all",      label:"All",      col:"#4ade80" },
                { key:"critical", label:"Critical", col:"#f87171" },
                { key:"high",     label:"High",     col:"#fb923c" },
                { key:"medium",   label:"Medium",   col:"#fbbf24" },
              ].map(({ key, label, col }) => (
                <button key={key} onClick={() => setSidebarFilter(key)}
                  className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide transition-all"
                  style={sidebarFilter===key
                    ? { background:col+"18", border:`1px solid ${col}45`, color:col }
                    : { background:"#0a1a0a", border:"1px solid #1a3320", color:"#2a4a3a" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedCities.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-xs" style={{ color: "#2a4a3a" }}>
                {data.length === 0 ? "No data. Check sheet access." : "No cities match."}
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
                    borderColor: "#0a1a0a",
                    background:  isSelected ? getDangerBg(maxDays) : "transparent",
                    borderLeft:  isSelected ? `2px solid ${color}` : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background="rgba(74,222,128,0.03)"; }}
                  onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background="transparent"; }}>

                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background:color, boxShadow:maxDays>30?`0 0 5px ${color}`:"none" }} />
                      <span className="font-semibold text-sm" style={{ color:isSelected?"#e2f5e8":"#8ab89a" }}>
                        {city}
                      </span>
                      {!hasMapped && (
                        <span className="text-[9px] px-1 rounded" style={{ background:"#0a1a0a", color:"#2a4a3a" }}>?</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background:color+"18", color, border:`1px solid ${color}35` }}>
                      {issues.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wide" style={{ color }}>
                      {getDangerLabel(maxDays)}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color:"#2a4a3a" }}>{maxDays}d max</span>
                  </div>

                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background:"#0a1a0a" }}>
                    <div className="h-full rounded-full"
                      style={{ width:`${Math.min((maxDays/300)*100,100)}%`, background:`linear-gradient(90deg,${color}40,${color})` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "#0f2015" }}>
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#1a3320" }}>
                Auto-refresh · 5 min
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                <span className="text-[9px]" style={{ color: "#2a4a3a" }}>Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedCity && cityData[selectedCity] && (
        <IssueModal city={selectedCity} issues={cityData[selectedCity]} onClose={() => setSelectedCity(null)} />
      )}
    </div>
  );
}
