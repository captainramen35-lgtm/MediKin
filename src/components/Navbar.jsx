import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { getInitials } from "../utils/helpers";
import { useToast } from "../context/ToastContext";
import { Cross, QrCode, LogOut, LayoutDashboard, Scan } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import logoImg from "../assets/logo.png";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = async () => {
    await signOut(auth);
    addToast("Signed out successfully", "success");
    navigate("/");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10, 14, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <img
          src={logoImg}
          alt="MediKin Logo"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--text-primary)",
          }}
        >
          MediKin
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <LanguageSwitcher />
        <Link to="/scan" style={{ textDecoration: "none" }}>
          <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: "13px" }}>
            <Scan size={15} />
            {t("nav.scan") || "Scan QR"}
          </button>
        </Link>

        {user ? (
          <>
            <Link to="/dashboard" style={{ textDecoration: "none" }}>
              <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: "13px" }}>
                <LayoutDashboard size={15} />
                {t("nav.dashboard") || "Dashboard"}
              </button>
            </Link>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-blue), #7b9cff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {getInitials(user.displayName || user.email)}
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost"
                style={{ padding: "8px 12px", fontSize: "13px" }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <Link to="/signup" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "9px 18px", fontSize: "13px" }}>
              Get Started
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
