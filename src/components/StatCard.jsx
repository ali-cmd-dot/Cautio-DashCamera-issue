"use client";

const COLOR_MAP = {
  blue:   { text: "#60a5fa", border: "rgba(96,165,250,0.2)",  glow: "rgba(96,165,250,0.08)"  },
  red:    { text: "#f87171", border: "rgba(248,113,113,0.25)", glow: "rgba(248,113,113,0.08)" },
  orange: { text: "#fb923c", border: "rgba(251,146,60,0.25)",  glow: "rgba(251,146,60,0.08)"  },
  yellow: { text: "#facc15", border: "rgba(250,204,21,0.2)",   glow: "rgba(250,204,21,0.06)"  },
};

export default function StatCard({ label, value, color = "blue", icon }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div
      className="rounded-xl px-3.5 py-3 min-w-[112px]"
      style={{
        background: "rgba(10,16,28,0.92)",
        border: `1px solid ${c.border}`,
        boxShadow: `0 4px 20px ${c.glow}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {icon && <div className="text-base mb-1 opacity-70">{icon}</div>}
      <div className="text-2xl font-bold font-mono leading-none" style={{ color: c.text }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest mt-1.5 font-medium" style={{ color: "#4a6080" }}>
        {label}
      </div>
    </div>
  );
}
