export function getDangerColor(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "#c0392b";
  if (d > 15) return "#e74c3c";
  if (d > 7)  return "#e67e22";
  return "#f1c40f";
}

export function getDangerGlow(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(192,57,43,0.6)";
  if (d > 15) return "rgba(231,76,60,0.5)";
  if (d > 7)  return "rgba(230,126,34,0.4)";
  return "rgba(241,196,15,0.3)";
}

export function getDangerBg(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(192,57,43,0.12)";
  if (d > 15) return "rgba(231,76,60,0.08)";
  if (d > 7)  return "rgba(230,126,34,0.08)";
  return "rgba(241,196,15,0.06)";
}

export function getDangerBorder(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(192,57,43,0.5)";
  if (d > 15) return "rgba(231,76,60,0.4)";
  if (d > 7)  return "rgba(230,126,34,0.35)";
  return "rgba(241,196,15,0.3)";
}

export function getDangerLabel(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "CRITICAL";
  if (d > 15) return "HIGH";
  if (d > 7)  return "MEDIUM";
  return "LOW";
}

export function getPinSize(count) {
  if (count >= 15) return 18;
  if (count >= 10) return 15;
  if (count >= 5)  return 12;
  if (count >= 3)  return 10;
  return 8;
}

export const DANGER_LEVELS = [
  { label: "0–7 days",   sublabel: "LOW",      color: "#f1c40f" },
  { label: "8–15 days",  sublabel: "MEDIUM",   color: "#e67e22" },
  { label: "16–30 days", sublabel: "HIGH",     color: "#e74c3c" },
  { label: "30+ days",   sublabel: "CRITICAL", color: "#c0392b" },
];
