"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDangerColor, getDangerBg, getDangerBorder, getDangerLabel } from "@/lib/colorUtils";

// ── Robust Days reader ─────────────────────────────────────────────
function getDays(row) {
  for (const k of Object.keys(row)) {
    // Strip all non-alpha chars, lowercase, compare
    const clean = k.toLowerCase().replace(/[^a-z]/g, "");
    if (clean === "dayspending" || clean === "daypending") {
      const num = parseInt(row[k].toString().replace(/[^0-9]/g, ""));
      return isNaN(num) ? 0 : num;
    }
  }
  // Fallback: any key containing both "day" and "pend"
  for (const k of Object.keys(row)) {
    const kl = k.toLowerCase();
    if (kl.includes("day") && kl.includes("pend")) {
      const num = parseInt(row[k].toString().replace(/[^0-9]/g, ""));
      return isNaN(num) ? 0 : num;
    }
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

function ModalContent({ city, issues, onClose }) {
  const sorted   = [...issues].sort((a, b) => getDays(b) - getDays(a));
  const maxDays  = Math.max(...issues.map(getDays));
  const critical = issues.filter(i => getDays(i) > 30).length;
  const high     = issues.filter(i => { const d = getDays(i); return d > 15 && d <= 30; }).length;

  return (
    <div
      className="fixed inset-0 animate-fade-in"
      style={{ zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(2,8,2,0.85)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className="relative flex flex-col animate-slide-up"
        style={{
          width: "100%",
          maxWidth: "1100px",
          maxHeight: "88vh",
          background: "#060e06",
          border: `1px solid ${getDangerColor(maxDays)}35`,
          borderRadius: "16px",
          boxShadow: `0 0 80px ${getDangerColor(maxDays)}12, 0 0 0 1px rgba(74,222,128,0.05), 0 30px 60px rgba(0,0,0,0.8)`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid #1a3320" }}
        >
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "#3a6a4a" }}>
              <span>Fleet Monitor</span>
              <span>›</span>
              <span>Issues</span>
              <span>›</span>
              <span style={{ color: "#4ade80" }}>{city}</span>
            </div>

            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: getDangerColor(maxDays),
                  boxShadow: `0 0 8px ${getDangerColor(maxDays)}`,
                }}
              />
              <h2 className="text-xl font-bold" style={{ color: "#e2f5e8" }}>{city}</h2>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-mono font-bold tracking-wider"
                style={{
                  background: getDangerBg(maxDays),
                  border: `1px solid ${getDangerBorder(maxDays)}`,
                  color: getDangerColor(maxDays),
                }}
              >
                {getDangerLabel(maxDays)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#3a6a4a" }}>
              <span>{issues.length} unresolved issue{issues.length !== 1 ? "s" : ""}</span>
              {critical > 0 && <span style={{ color: "#ef4444" }}>● {critical} critical (30d+)</span>}
              {high > 0     && <span style={{ color: "#f97316" }}>● {high} high (16–30d)</span>}
              <span>
                Max:{" "}
                <span className="font-mono" style={{ color: getDangerColor(maxDays) }}>
                  {maxDays}d
                </span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm"
            style={{ border: "1px solid #1a3320", color: "#3a6a4a" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#1a3320";
              e.currentTarget.style.color = "#4ade80";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#3a6a4a";
            }}
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead style={{ position: "sticky", top: 0, background: "#040a04", zIndex: 10 }}>
              <tr>
                <th style={{ ...thStyle, width: "36px" }}>#</th>
                {COLS.map(col => (
                  <th key={col.key} style={thStyle}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((issue, i) => {
                const days   = getDays(issue);
                const color  = getDangerColor(days);
                const isCrit = days > 30;

                return (
                  <tr
                    key={i}
                    className="issue-row"
                    style={{
                      borderBottom: "1px solid #0a1a0a",
                      background: i % 2 === 0 ? "transparent" : "rgba(10,21,10,0.5)",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* # */}
                    <td style={{ ...tdStyle, color: "#1a3a2a", fontFamily: "monospace" }}>{i + 1}</td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                          background: color,
                          boxShadow: isCrit ? `0 0 5px ${color}` : "none",
                        }} />
                        <span style={{ color, fontSize: "11px", fontWeight: 600 }}>
                          {issue["Status"] || getDangerLabel(days)}
                        </span>
                      </div>
                    </td>

                    {/* Vehicle No */}
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4ade80", letterSpacing: "0.05em" }}>
                        {issue["Vehicle No"] || "—"}
                      </span>
                    </td>

                    {/* Client */}
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span style={{ color: "#c8e6c9" }}>{issue["Client"] || "—"}</span>
                    </td>

                    {/* POC */}
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span style={{ color: "#4a7a5a", fontSize: "12px" }}>{issue["POC Name"] || "—"}</span>
                    </td>

                    {/* Issue */}
                    <td style={{ ...tdStyle, maxWidth: "180px" }}>
                      <div style={{ color: "#6a9a7a", lineHeight: 1.4 }} title={issue["Issue"] || ""}>
                        {issue["Issue"]
                          ? issue["Issue"].length > 45
                            ? issue["Issue"].slice(0, 45) + "…"
                            : issue["Issue"]
                          : "—"}
                      </div>
                    </td>

                    {/* Last Online */}
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#2a4a3a" }}>
                        {issue["Last Online"] || "—"}
                      </span>
                    </td>

                    {/* Avail Date */}
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#2a4a3a" }}>
                        {issue["Latest Avail Date"] || "—"}
                      </span>
                    </td>

                    {/* Days Pending */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          padding: "3px 8px",
                          borderRadius: "5px",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          background: color,
                          boxShadow: isCrit ? `0 0 10px ${color}50` : "none",
                        }}>
                          {days}d
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, color, letterSpacing: "0.05em" }}>
                          {getDangerLabel(days)}
                        </span>
                      </div>
                      {/* bar */}
                      <div style={{ marginTop: "5px", height: "2px", borderRadius: "1px", background: "#0a1a0a", width: "80px" }}>
                        <div style={{
                          height: "100%", borderRadius: "1px",
                          width: `${Math.min((days / 300) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${color}50, ${color})`,
                        }} />
                      </div>
                    </td>

                    {/* History */}
                    <td style={{ ...tdStyle, maxWidth: "200px" }}>
                      <div
                        style={{ fontFamily: "monospace", fontSize: "10px", color: "#1a3a2a", lineHeight: 1.5 }}
                        title={issue["Availability History"] || ""}
                      >
                        {issue["Availability History"]
                          ? issue["Availability History"].length > 70
                            ? issue["Availability History"].slice(0, 70) + "…"
                            : issue["Availability History"]
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
        <div
          className="shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderTop: "1px solid #1a3320", background: "#040a04" }}
        >
          <span style={{ fontSize: "11px", color: "#1a3a2a" }}>
            Sorted by Days Pending · highest first
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 500,
              background: "#0d1f0d",
              color: "#4a7a5a",
              border: "1px solid #1a3320",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#4ade80";
              e.currentTarget.style.borderColor = "#4ade80";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#4a7a5a";
              e.currentTarget.style.borderColor = "#1a3320";
            }}
          >
            Close · esc
          </button>
        </div>
      </div>
    </div>
  );
}

// Shared cell styles
const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#2a4a3a",
  borderBottom: "1px solid #1a3320",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 12px",
  verticalAlign: "middle",
  fontSize: "13px",
  color: "#e2f5e8",
};

// Portal wrapper — renders outside React tree at document.body
export default function IssueModal(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = (e) => { if (e.key === "Escape") props.onClose(); };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      setMounted(false);
    };
  }, [props.onClose]);

  if (!mounted) return null;
  return createPortal(<ModalContent {...props} />, document.body);
}
