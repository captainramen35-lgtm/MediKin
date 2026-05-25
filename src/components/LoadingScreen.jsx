const LoadingScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      gap: "20px",
    }}
  >
    {/* Pulsing logo */}
    <div
      style={{
        width: "64px",
        height: "64px",
        background: "var(--accent-red)",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "loadingPulse 1.4s ease-in-out infinite",
      }}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <path
          d="M17 4v26M4 17h26"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>

    <span
      style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "22px",
        color: "var(--text-primary)",
        letterSpacing: "-0.5px",
      }}
    >
      MediKin
    </span>

    <style>{`
      @keyframes loadingPulse {
        0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.4); }
        50% { opacity: 0.85; transform: scale(1.05); box-shadow: 0 0 0 14px rgba(230, 57, 70, 0); }
      }
    `}</style>
  </div>
);

export default LoadingScreen;
