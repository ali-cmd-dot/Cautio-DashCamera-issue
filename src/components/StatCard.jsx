"use client";

export default function StatCard({ label, value, color = "green", icon, sub }) {
  const styles = {
    green:  { text: "#4ade80", border: "rgba(74,222,128,0.2)",  bg: "rgba(74,222,128,0.05)"  },
    red:    { text: "#f87171", border: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.05)" },
    orange: { text: "#fb923c", border: "rgba(251,146,60,0.25)",  bg: "rgba(251,146,60,0.05)"  },
    yellow: { text: "#fbbf24", border: "rgba(251,191,36,0.22)",  bg: "rgba(251,191,36,0.04)"  },
    blue:   { text: "#60a5fa", border: "rgba(96,165,250,0.22)",  bg: "rgba(96,165,250,0.04)"  },
  };
  const s = styles[color] || styles.green;

  return (
    <div className="rounded-xl px-4 py-3 min-w-[120px] transition-all hover:scale-105 cursor-default"
      style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: "blur(12px)" }}>
      {icon && <div className="text-sm mb-1.5" style={{ opacity: 0.8 }}>{icon}</div>}
      <div className="text-2xl font-bold font-mono leading-none" style={{ color: s.text }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest mt-1.5 font-semibold" style={{ color: "#3a6a4a" }}>
        {label}
      </div>
      {sub && <div className="text-[9px] mt-0.5 font-mono" style={{ color: "#2a4a3a" }}>{sub}</div>}
    </div>
  );
}
