import logoImg from "../assets/logo.png";

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
    <img
      src={logoImg}
      alt="MediKin Logo"
      style={{
        width: "68px",
        height: "68px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: "loadingPulse 1.4s ease-in-out infinite",
      }}
    />

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
