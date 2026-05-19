export function getDangerColor(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "#ef4444";
  if (d > 15) return "#f97316";
  if (d > 7)  return "#eab308";
  return "#4ade80";
}
export function getDangerGlow(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(239,68,68,0.6)";
  if (d > 15) return "rgba(249,115,22,0.5)";
  if (d > 7)  return "rgba(234,179,8,0.4)";
  return "rgba(74,222,128,0.4)";
}
export function getDangerBg(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(239,68,68,0.08)";
  if (d > 15) return "rgba(249,115,22,0.08)";
  if (d > 7)  return "rgba(234,179,8,0.06)";
  return "rgba(74,222,128,0.06)";
}
export function getDangerBorder(days) {
  const d = parseInt(days) || 0;
  if (d > 30) return "rgba(239,68,68,0.4)";
  if (d > 15) return "rgba(249,115,22,0.35)";
  if (d > 7)  return "rgba(234,179,8,0.3)";
  return "rgba(74,222,128,0.3)";
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
  { label: "0–7 days",   sublabel: "LOW",      color: "#4ade80" },
  { label: "8–15 days",  sublabel: "MEDIUM",   color: "#eab308" },
  { label: "16–30 days", sublabel: "HIGH",     color: "#f97316" },
  { label: "30+ days",   sublabel: "CRITICAL", color: "#ef4444" },
];
