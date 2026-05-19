"use client";
import { useEffect } from "react";
import { getDangerColor, getDangerBg, getDangerBorder, getDangerLabel } from "@/lib/colorUtils";

function getDays(row) {
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().replace(/\s+/g," ").trim() === "days pending") return parseInt(row[k]) || 0;
  }
  return 0;
}

const COLS = [
  { key: "Status",               label: "Status"      },
  { key: "Vehicle No",           label: "Vehicle No"  },
  { key: "Client",               label: "Client"      },
  { key: "POC Name",             label: "POC"         },
  { key: "Issue",                label: "Issue"       },
  { key: "Last Online",          label: "Last Online" },
  { key: "Latest Avail Date",    label: "Avail Date"  },
  { key: "Days Pending",         label: "Days"        },
  { key: "Availability History", label: "History"     },
];

export default function IssueModal({ city, issues, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const sorted   = [...issues].sort((a, b) => getDays(b) - getDays(a));
  const maxDays  = Math.max(...issues.map(getDays));
  const critical = issues.filter(i => getDays(i) > 30).length;
  const high     = issues.filter(i => { const d=getDays(i); return d>15&&d<=30; }).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(2,8,2,0.8)" }} onClick={onClose} />

      <div className="relative w-full max-w-6xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "#060e06",
          border: `1px solid ${getDangerColor(maxDays)}35`,
          boxShadow: `0 0 80px ${getDangerColor(maxDays)}12, 0 0 0 1px rgba(74,222,128,0.05), 0 30px 60px rgba(0,0,0,0.7)`,
        }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "#1a3320" }}>
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "#3a6a4a" }}>
              <span>Fleet Monitor</span>
              <span>›</span>
              <span>Issues</span>
              <span>›</span>
              <span style={{ color: "#4ade80" }}>{city}</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full live-pulse" style={{ background: getDangerColor(maxDays) }} />
              <h2 className="text-xl font-bold tracking-wide" style={{ fontFamily: "'Inter',sans-serif" }}>{city}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold tracking-wider"
                style={{ background: getDangerBg(maxDays), border: `1px solid ${getDangerBorder(maxDays)}`, color: getDangerColor(maxDays) }}>
                {getDangerLabel(maxDays)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#3a6a4a" }}>
              <span>{issues.length} unresolved</span>
              {critical > 0 && <span style={{ color: "#ef4444" }}>● {critical} critical</span>}
              {high > 0     && <span style={{ color: "#f97316" }}>● {high} high</span>}
              <span>Max: <span className="font-mono" style={{ color: getDangerColor(maxDays) }}>{maxDays}d</span></span>
            </div>
          </div>

          <button onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm"
            style={{ border: "1px solid #1a3320", color: "#3a6a4a" }}
            onMouseEnter={e => { e.currentTarget.style.background="#1a3320"; e.currentTarget.style.color="#4ade80"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#3a6a4a"; }}>
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "#040a04" }}>
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-8"
                  style={{ color: "#2a4a3a", borderBottom: "1px solid #1a3320" }}>#</th>
                {COLS.map(col => (
                  <th key={col.key} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "#2a4a3a", borderBottom: "1px solid #1a3320" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((issue, i) => {
                const days  = getDays(issue);
                const color = getDangerColor(days);
                const isCrit = days > 30;

                return (
                  <tr key={i} className="issue-row border-b transition-colors"
                    style={{ borderColor: "#0a1a0a", background: i%2===0?"transparent":"rgba(10,21,10,0.5)" }}>
                    <td className="px-3 py-3.5 text-xs font-mono" style={{ color: "#1a3a2a" }}>{i+1}</td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: color, boxShadow: isCrit?`0 0 5px ${color}`:"none" }} />
                        <span className="text-xs font-semibold" style={{ color }}>{issue["Status"] || getDangerLabel(days)}</span>
                      </div>
                    </td>

                    {/* Vehicle No */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono font-bold text-sm tracking-wider" style={{ color: "#4ade80" }}>
                        {issue["Vehicle No"] || "—"}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span style={{ color: "#c8e6c9" }}>{issue["Client"] || "—"}</span>
                    </td>

                    {/* POC */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="text-xs" style={{ color: "#4a7a5a" }}>{issue["POC Name"] || "—"}</span>
                    </td>

                    {/* Issue */}
                    <td className="px-3 py-3.5 max-w-[180px]">
                      <div className="text-sm leading-snug" style={{ color: "#6a9a7a" }} title={issue["Issue"]||""}>
                        {issue["Issue"]?(issue["Issue"].length>50?issue["Issue"].slice(0,50)+"…":issue["Issue"]):"—"}
                      </div>
                    </td>

                    {/* Last Online */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs" style={{ color: "#2a4a3a" }}>{issue["Last Online"]||"—"}</span>
                    </td>

                    {/* Avail Date */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs" style={{ color: "#2a4a3a" }}>{issue["Latest Avail Date"]||"—"}</span>
                    </td>

                    {/* Days Pending */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded font-mono text-xs font-bold text-white whitespace-nowrap"
                          style={{ background: color, boxShadow: isCrit?`0 0 10px ${color}50`:"none" }}>
                          {days}d
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color }}>
                          {getDangerLabel(days)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-0.5 rounded-full" style={{ background: "#0a1a0a", width:"80px" }}>
                        <div className="h-full rounded-full"
                          style={{ width:`${Math.min((days/300)*100,100)}%`, background:`linear-gradient(90deg,${color}50,${color})` }} />
                      </div>
                    </td>

                    {/* History */}
                    <td className="px-3 py-3.5 max-w-[200px]">
                      <div className="text-[10px] leading-relaxed font-mono" style={{ color: "#1a3a2a" }}
                        title={issue["Availability History"]||""}>
                        {issue["Availability History"]
                          ? (issue["Availability History"].length>80
                              ? issue["Availability History"].slice(0,80)+"…"
                              : issue["Availability History"])
                          : "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between text-xs border-t"
          style={{ borderColor: "#1a3320", background: "#040a04" }}>
          <span style={{ color: "#1a3a2a" }}>Sorted by Days Pending · highest first</span>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-xs transition-all"
            style={{ background: "#0d1f0d", color: "#4a7a5a", border: "1px solid #1a3320" }}
            onMouseEnter={e => { e.currentTarget.style.color="#4ade80"; e.currentTarget.style.borderColor="#4ade80"; }}
            onMouseLeave={e => { e.currentTarget.style.color="#4a7a5a"; e.currentTarget.style.borderColor="#1a3320"; }}>
            Close · esc
          </button>
        </div>
      </div>
    </div>
  );
}
