import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronRight, Camera, CameraOff } from "lucide-react";

const Scanner = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const scannerRef = useRef(null);
  const isHandled = useRef(false);
  const isCameraRunning = useRef(false);

  const handleSuccess = (decodedText) => {
    if (isHandled.current) return;
    isHandled.current = true;

    // Stop camera safely
    if (scannerRef.current && isCameraRunning.current) {
      isCameraRunning.current = false;
      try {
        scannerRef.current.stop().catch((e) => console.log("Silent stop error:", e));
      } catch (err) {
        console.log("Synchronous stop error:", err);
      }
    }

    // Parse URL to extract profile ID
    try {
      const url = new URL(decodedText);
      const parts = url.pathname.split("/");
      const emergencyIdx = parts.indexOf("emergency");
      if (emergencyIdx !== -1 && parts[emergencyIdx + 1]) {
        navigate(`/emergency/${parts[emergencyIdx + 1]}`);
        return;
      }
      navigate(`/emergency/${parts[parts.length - 1]}`);
    } catch {
      // Not a URL — treat as profile ID
      navigate(`/emergency/${decodedText}`);
    }
  };

  const startCamera = async () => {
    setError("");
    setStarting(true);

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setError("No camera found on this device.");
        setStarting(false);
        return;
      }

      // Prefer back camera
      const camera =
        cameras.find((c) =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("rear") ||
          c.label.toLowerCase().includes("environment")
        ) || cameras[cameras.length - 1];

      const qr = new Html5Qrcode("qr-video-container");
      scannerRef.current = qr;

      await qr.start(
        { deviceId: { exact: camera.id } },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        handleSuccess,
        () => {} // silent error
      );

      setCameraStarted(true);
      isCameraRunning.current = true;
    } catch (err) {
      // Try with any camera if specific one fails
      try {
        const qr = new Html5Qrcode("qr-video-container");
        scannerRef.current = qr;
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleSuccess,
          () => {}
        );
        setCameraStarted(true);
        isCameraRunning.current = true;
      } catch (err2) {
        setError("Camera access denied. Please allow camera permission and try again.");
      }
    }
    setStarting(false);
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraRunning.current) {
      isCameraRunning.current = false;
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.log("Error in stopCamera:", err);
      }
    }
    setCameraStarted(false);
    isHandled.current = false;
  };

  useEffect(() => {
    // Auto-start on mount
    startCamera();
    return () => {
      if (scannerRef.current && isCameraRunning.current) {
        isCameraRunning.current = false;
        try {
          scannerRef.current.stop().catch((e) => console.log("Silent stop error in cleanup:", e));
        } catch (err) {
          console.log("Synchronous stop error in cleanup:", err);
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManual = () => {
    const id = manualId.trim();
    if (!id) return;
    navigate(`/emergency/${id}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Scan QR Code
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "14px" }}>
          Point your camera at a MediKin QR code to view emergency medical information instantly.
        </p>

        {/* Camera viewfinder */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "360px",
            margin: "0 auto 24px",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#000",
            aspectRatio: "1 / 1",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* The actual camera feed container */}
          <div
            id="qr-video-container"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Overlay when camera is running */}
          {cameraStarted && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Dark vignette corners */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at center, transparent 38%, rgba(0,0,0,0.55) 70%)",
                }}
              />

              {/* Targeting brackets — 200x200 box centered */}
              <div style={{ position: "absolute", width: "200px", height: "200px" }}>
                {/* Top-left */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "28px", height: "28px", borderTop: "3px solid #E63946", borderLeft: "3px solid #E63946", borderRadius: "4px 0 0 0" }} />
                {/* Top-right */}
                <div style={{ position: "absolute", top: 0, right: 0, width: "28px", height: "28px", borderTop: "3px solid #E63946", borderRight: "3px solid #E63946", borderRadius: "0 4px 0 0" }} />
                {/* Bottom-left */}
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "28px", height: "28px", borderBottom: "3px solid #E63946", borderLeft: "3px solid #E63946", borderRadius: "0 0 0 4px" }} />
                {/* Bottom-right */}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderBottom: "3px solid #E63946", borderRight: "3px solid #E63946", borderRadius: "0 0 4px 0" }} />

                {/* Animated scan line */}
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    right: "8px",
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #E63946, transparent)",
                    borderRadius: "1px",
                    animation: "scanLine 1.8s linear infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* Not started state */}
          {!cameraStarted && !starting && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                background: "rgba(10, 14, 26, 0.95)",
              }}
            >
              <Camera size={48} color="var(--text-muted)" />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Camera not started</p>
              <button onClick={startCamera} className="btn-primary" style={{ fontSize: "13px", padding: "10px 20px" }}>
                <Camera size={15} />
                Start Camera
              </button>
            </div>
          )}

          {/* Starting state */}
          {starting && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                background: "rgba(10, 14, 26, 0.95)",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="typing-dot"
                    style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-red)" }}
                  />
                ))}
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Starting camera…</p>
            </div>
          )}
        </div>

        {/* Camera status + stop button */}
        {cameraStarted && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#2EC4B6",
                animation: "loadingPulse 1.5s infinite",
              }}
            />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Scanning… point at any MediKin QR code
            </span>
            <button
              onClick={stopCamera}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                marginLeft: "4px",
              }}
              title="Stop camera"
            >
              <CameraOff size={16} />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "rgba(230, 57, 70, 0.1)",
              border: "1px solid rgba(230, 57, 70, 0.25)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#ff8a8a",
            }}
          >
            {error}
          </div>
        )}

        {/* Manual input fallback */}
        <div
          style={{
            padding: "20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Or enter a Profile ID manually
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              className="medikin-input"
              placeholder="Paste profile ID or URL..."
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManual()}
              style={{ flex: 1 }}
            />
            <button onClick={handleManual} className="btn-primary" style={{ padding: "12px 16px", flexShrink: 0 }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      <style>{`
        /* Override html5-qrcode internal styles */
        #qr-video-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        #qr-video-container canvas {
          display: none !important;
        }
        @keyframes scanLine {
          0% { top: 8px; }
          50% { top: calc(100% - 10px); }
          100% { top: 8px; }
        }
        @keyframes loadingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
