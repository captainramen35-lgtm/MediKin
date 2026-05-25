import { BLOOD_GROUP_COLORS } from "../utils/helpers";

const BloodGroupBadge = ({ bloodGroup, size = "md" }) => {
  const style = BLOOD_GROUP_COLORS[bloodGroup] || {
    bg: "rgba(255,255,255,0.08)",
    color: "#8892A4",
    border: "rgba(255,255,255,0.12)",
  };

  const sizes = {
    sm: { fontSize: "11px", padding: "3px 8px", borderRadius: "6px" },
    md: { fontSize: "13px", padding: "4px 10px", borderRadius: "8px" },
    lg: { fontSize: "20px", padding: "8px 16px", borderRadius: "10px", fontWeight: 700 },
    xl: { fontSize: "36px", padding: "16px 28px", borderRadius: "14px", fontWeight: 800 },
  };

  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontFamily: "'Syne', sans-serif",
        fontWeight: size === "xl" || size === "lg" ? 700 : 600,
        letterSpacing: "0.5px",
        ...s,
      }}
    >
      <span style={{ fontSize: size === "xl" ? "28px" : "0.9em" }}>🩸</span>
      {bloodGroup || "Unknown"}
    </span>
  );
};

export default BloodGroupBadge;
