const SkeletonLoader = ({ width = "100%", height = "20px", borderRadius = "8px", style = {} }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const SkeletonCard = () => (
  <div className="glass-card" style={{ padding: "24px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
      <SkeletonLoader width="48px" height="48px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <SkeletonLoader width="60%" height="18px" style={{ marginBottom: "8px" }} />
        <SkeletonLoader width="40%" height="14px" />
      </div>
    </div>
    <SkeletonLoader height="12px" style={{ marginBottom: "8px" }} />
    <SkeletonLoader width="80%" height="12px" style={{ marginBottom: "8px" }} />
    <SkeletonLoader width="60%" height="12px" />
  </div>
);

export const SkeletonBrief = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <SkeletonLoader height="80px" borderRadius="12px" />
    <SkeletonLoader height="120px" borderRadius="12px" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <SkeletonLoader height="100px" borderRadius="12px" />
      <SkeletonLoader height="100px" borderRadius="12px" />
      <SkeletonLoader height="100px" borderRadius="12px" />
      <SkeletonLoader height="100px" borderRadius="12px" />
    </div>
  </div>
);

export default SkeletonLoader;
