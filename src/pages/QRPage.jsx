import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../context/ToastContext";
import BloodGroupBadge from "../components/BloodGroupBadge";
import SkeletonLoader from "../components/SkeletonLoader";
import { Download, Printer, Copy, ArrowLeft, Zap, MessageSquare } from "lucide-react";
import logoImg from "../assets/logo.png";

const QRPage = () => {
  const { id } = useParams();
  const { profile, loading } = useProfile(id);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const printRef = useRef();

  const emergencyUrl = `${window.location.origin}/emergency/${id}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `MediKin QR - ${profile?.patient?.name || "Patient"}`,
  });

  const handleDownload = () => {
    const svgEl = document.querySelector("#medikin-qr svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 320;
    canvas.width = size;
    canvas.height = size;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 10, 10, size - 20, size - 20);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `medikin-qr-${profile?.patient?.name || "patient"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      addToast("QR code downloaded!", "success");
    };
    img.src = url;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emergencyUrl);
      addToast("Emergency link copied!", "success");
    } catch {
      addToast("Failed to copy link", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <SkeletonLoader width="300px" height="300px" borderRadius="16px" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Profile not found.</p>
        </div>
      </div>
    );
  }

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
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="btn-ghost"
        style={{
          position: "fixed",
          top: "80px",
          left: "24px",
          padding: "8px 14px",
          fontSize: "13px",
        }}
      >
        <ArrowLeft size={15} />
        Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", maxWidth: "480px", width: "100%" }}
      >
        {/* Patient name */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          {profile.patient?.name}
        </h1>

        <div style={{ marginBottom: "36px" }}>
          <BloodGroupBadge bloodGroup={profile.patient?.bloodGroup} size="md" />
        </div>

        {/* QR Code with pulsing ring */}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "36px",
          }}
        >
          {/* Pulsing ring */}
          <div
            className="qr-ring"
            style={{
              position: "absolute",
              width: "320px",
              height: "320px",
              borderRadius: "24px",
              border: "3px solid var(--accent-red)",
              opacity: 0.5,
            }}
          />

          {/* QR Code */}
          <div
            id="medikin-qr"
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <QRCodeSVG
              value={emergencyUrl}
              size={260}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "24px" }}>
          <button onClick={handleDownload} className="btn-ghost" style={{ fontSize: "13px", padding: "10px 16px" }}>
            <Download size={15} />
            Download
          </button>
          <button onClick={handlePrint} className="btn-ghost" style={{ fontSize: "13px", padding: "10px 16px" }}>
            <Printer size={15} />
            Print Card
          </button>
          <button onClick={handleCopy} className="btn-ghost" style={{ fontSize: "13px", padding: "10px 16px" }}>
            <Copy size={15} />
            Copy Link
          </button>
        </div>

        {/* Extra actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "28px" }}>
          <button
            onClick={() => navigate(`/emergency/${id}`)}
            className="btn-primary"
            style={{ fontSize: "13px", padding: "10px 18px" }}
          >
            <Zap size={15} />
            View Emergency Brief
          </button>
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="btn-ghost"
            style={{ fontSize: "13px", padding: "10px 18px" }}
          >
            <MessageSquare size={15} />
            AI Chat
          </button>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
          Show this code to any nurse or doctor.{" "}
          <strong style={{ color: "var(--text-primary)" }}>No app or account needed to scan.</strong>
        </p>
      </motion.div>

      {/* Hidden print layout */}
      <div style={{ display: "none" }}>
        <div
          ref={printRef}
          style={{
            background: "white",
            color: "black",
            padding: "40px",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <img
                src={logoImg}
                alt="MediKin Logo"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "20px" }}>MediKin</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
              {profile.patient?.name}
            </h2>
            <span
              style={{
                background: "#f0f0f0",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Blood Group: {profile.patient?.bloodGroup}
            </span>
          </div>

          <div style={{ margin: "24px auto", display: "inline-block" }}>
            <QRCodeSVG value={emergencyUrl} size={220} level="H" />
          </div>

          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.5, marginTop: "20px" }}>
            Scan for emergency medical information
          </p>
          <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Powered by MediKin — medikin-49af6.web.app
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRPage;
