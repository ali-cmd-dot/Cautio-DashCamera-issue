"use client";

import { useEffect } from "react";
import {
  getDangerColor, getDangerBg, getDangerBorder, getDangerLabel,
} from "@/lib/colorUtils";

const COLUMNS = [
  { key: "Status",               label: "Status"     },
  { key: "Vehicle No",           label: "Vehicle No" },
  { key: "Client",               label: "Client"     },
  { key: "POC Name",             label: "POC"        },
  { key: "Issue",                label: "Issue"      },
  { key: "Last Online",          label: "Last Online"},
  { key: "Latest Avail Date",    label: "Avail Date" },
  { key: "Days Pending",         label: "Days"       },
  { key: "Availability History", label: "History"    },
];

export default function IssueModal({ city, issues, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const sorted    = [...issues].sort((a, b) => (parseInt(b["Days Pending"]) || 0) - (parseInt(a["Days Pending"]) || 0));
  const maxDays   = Math.max(...issues.map((i) => parseInt(i["Days Pending"]) || 0));
  const critical  = issues.filter((i) => parseInt(i["Days Pending"]) > 30).length;
  const high      = issues.filter((i) => { const d = parseInt(i["Days Pending"]); return d > 15 && d <= 30; }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(4,7,15,0.75)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-6xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        style={{
          background: "#0a1220",
          border: `1px solid ${getDangerColor(maxDays)}40`,
          boxShadow: `0 0 60px ${getDangerColor(maxDays)}15, 0 25px 50px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "#1a2d4e" }}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: getDangerColor(maxDays), boxShadow: `0 0 8px ${getDangerColor(maxDays)}` }}
              />
              <h2 className="text-xl font-bold tracking-wide">{city}</h2>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-mono font-bold"
                style={{
                  background: getDangerBg(maxDays),
                  border: `1px solid ${getDangerBorder(maxDays)}`,
                  color: getDangerColor(maxDays),
                }}
              >
                {getDangerLabel(maxDays)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span style={{ color: "#4a6080" }}>{issues.length} unresolved issue{issues.length !== 1 ? "s" : ""}</span>
              {critical > 0 && <span style={{ color: "#c0392b" }}>● {critical} critical (30d+)</span>}
              {high > 0     && <span style={{ color: "#e74c3c" }}>● {high} high (16–30d)</span>}
              <span style={{ color: "#4a6080" }}>
                Max: <span className="font-mono" style={{ color: getDangerColor(maxDays) }}>{maxDays}d</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white"
            style={{ border: "1px solid #1a2d4e" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1a2d4e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "#070e1b" }}>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest w-8" style={{ color: "#1e3a5f", borderBottom: "1px solid #1a2d4e" }}>#</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "#2d4a6a", borderBottom: "1px solid #1a2d4e" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((issue, i) => {
                const days       = parseInt(issue["Days Pending"]) || 0;
                const color      = getDangerColor(days);
                const isCritical = days > 30;

                return (
                  <tr
                    key={i}
                    className="issue-row border-b transition-colors"
                    style={{ borderColor: "#0a1525", background: i % 2 === 0 ? "transparent" : "rgba(10,16,27,0.4)" }}
                  >
                    {/* # */}
                    <td className="px-3 py-3 text-xs font-mono" style={{ color: "#1e3a5f" }}>{i + 1}</td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: isCritical ? `0 0 5px ${color}` : "none" }} />
                        <span className="text-xs font-semibold" style={{ color }}>{issue["Status"] || getDangerLabel(days)}</span>
                      </div>
                    </td>

                    {/* Vehicle No */}
                    <td className="px-3 py-3">
                      <span className="font-mono font-bold text-sm tracking-wider" style={{ color: "#60a5fa" }}>
                        {issue["Vehicle No"] || "—"}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span style={{ color: "#cbd5e1" }}>{issue["Client"] || "—"}</span>
                    </td>

                    {/* POC Name */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs" style={{ color: "#7c9db5" }}>{issue["POC Name"] || "—"}</span>
                    </td>

                    {/* Issue */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="text-sm leading-snug" style={{ color: "#94a3b8" }} title={issue["Issue"] || ""}>
                        {issue["Issue"] ? (issue["Issue"].length > 50 ? issue["Issue"].slice(0, 50) + "…" : issue["Issue"]) : "—"}
                      </div>
                    </td>

                    {/* Last Online */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs" style={{ color: "#4a6080" }}>{issue["Last Online"] || "—"}</span>
                    </td>

                    {/* Latest Avail Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs" style={{ color: "#4a6080" }}>{issue["Latest Avail Date"] || "—"}</span>
                    </td>

                    {/* Days Pending */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="px-2.5 py-1 rounded-md font-mono text-xs font-bold text-white whitespace-nowrap"
                          style={{ background: color, boxShadow: isCritical ? `0 0 10px ${color}50` : "none" }}
                        >
                          {days}d
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{getDangerLabel(days)}</span>
                      </div>
                      {/* Progress bar — max scale 300d */}
                      <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: "#0f1d30", width: "80px" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min((days / 300) * 100, 100)}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
                      </div>
                    </td>

                    {/* Availability History */}
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="text-[10px] leading-relaxed font-mono" style={{ color: "#2d4a6a" }} title={issue["Availability History"] || ""}>
                        {issue["Availability History"]
                          ? (issue["Availability History"].length > 90
                              ? issue["Availability History"].slice(0, 90) + "…"
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
        <div className="px-6 py-3 flex items-center justify-between text-xs border-t" style={{ borderColor: "#1a2d4e", background: "#070e1b" }}>
          <span style={{ color: "#1e3a5f" }}>Sorted by Days Pending · highest first</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-xs transition-colors"
            style={{ background: "#1a2d4e", color: "#94a3b8", border: "1px solid #1e3a5f" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            Close · esc
          </button>
        </div>
      </div>
    </div>
  );
}
