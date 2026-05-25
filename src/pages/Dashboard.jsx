import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserProfiles } from "../hooks/useProfile";
import { hasStaleMedication, formatDate, daysSince } from "../utils/helpers";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { SkeletonCard } from "../components/SkeletonLoader";
import { Plus, QrCode, Edit, Zap, AlertTriangle, X, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { user } = useAuth();
  const { profiles, loading } = useUserProfiles(user?.uid);
  const navigate = useNavigate();
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const hasAnyStale = profiles.some((p) => hasStaleMedication(p.medications));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Stale medication banner */}
      {hasAnyStale && !dismissedBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{
            background: "rgba(244, 162, 97, 0.12)",
            borderBottom: "1px solid rgba(244, 162, 97, 0.25)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={16} color="#F4A261" />
            <span style={{ fontSize: "14px", color: "#F4A261", fontWeight: 500 }}>
              ⚠️ Some profiles may have outdated medications (added over 6 months ago). Tap to review.
            </span>
          </div>
          <button
            onClick={() => setDismissedBanner(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#F4A261",
              padding: "4px",
            }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              Welcome back, {user?.displayName?.split(" ")[0] || "there"} 👋
            </motion.h1>
            <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
              {profiles.length === 0
                ? "Create a profile for someone you love"
                : `Managing ${profiles.length} medical profile${profiles.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <Link to="/profile/create" style={{ textDecoration: "none" }}>
            <button className="btn-primary">
              <Plus size={16} />
              New Profile
            </button>
          </Link>
        </div>

        {/* Profiles list (One patient per line) */}
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {profiles.map((profile, i) => (
              <ProfileCard key={profile.id} profile={profile} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link to="/profile/create" style={{ textDecoration: "none" }}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--accent-red)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(230, 57, 70, 0.4)",
            color: "white",
            zIndex: 50,
          }}
          title="New Profile"
        >
          <Plus size={24} />
        </motion.button>
      </Link>
    </div>
  );
};

const ProfileCard = ({ profile, index }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isStale = hasStaleMedication(profile.medications);
  const conditions = profile.conditions || [];
  const shown = conditions.slice(0, 3);
  const extra = conditions.length - 3;

  const relativeSosTime = profile.lastSOSTriggeredAt
    ? daysSince(profile.lastSOSTriggeredAt)
    : null;

  const triggerSOS = () => {
    const event = new CustomEvent("trigger-sos", { detail: { profileId: profile.id } });
    window.dispatchEvent(event);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card"
      style={{
        padding: "28px",
        cursor: "default",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "24px",
      }}
    >
      {/* Left Area: Patient Information */}
      <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-red))",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text-primary)",
              flexShrink: 0,
            }}
          >
            {profile.patient?.name?.[0] || "?"}
          </div>

          <div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "19px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              {profile.patient?.name || "Unknown Patient"}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BloodGroupBadge bloodGroup={profile.patient?.bloodGroup} size="sm" />
              {isStale && (
                <span title="Medication may be outdated" style={{ fontSize: "11px", color: "#F4A261", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <span>⚠️</span> Outdated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conditions */}
        {shown.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {shown.map((c) => (
              <span key={c} className="pill pill-gray" style={{ fontSize: "11px" }}>
                {c}
              </span>
            ))}
            {extra > 0 && (
              <span className="pill pill-gray" style={{ fontSize: "11px" }}>
                +{extra} more
              </span>
            )}
          </div>
        )}

        {/* Last updated and Relative SOS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {t("dashboard.lastUpdated") || "Last updated"}:{" "}
            <strong style={{ color: "var(--text-secondary)" }}>
              {profile.lastUpdated ? formatDate(profile.lastUpdated) : "—"}
            </strong>
          </span>
          {relativeSosTime !== null && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--accent-red)",
                fontWeight: 700,
                background: "rgba(230,57,70,0.06)",
                padding: "3px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(230,57,70,0.12)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🚨 {t("dashboard.lastSos") || "Last SOS"}:{" "}
              {relativeSosTime === 0 ? "Today" : `${relativeSosTime} day${relativeSosTime > 1 ? "s" : ""} ago`}
            </span>
          )}
        </div>
      </div>

      {/* Right Area: Action Buttons (Two Spacious Rows) */}
      <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Row 1: Primary Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/profile/${profile.id}/qr`)}
            className="btn-primary"
            style={{ flex: 1.8, justifyContent: "center", padding: "10px 14px", fontSize: "13px", fontWeight: 700 }}
            title={t("dashboard.viewQR")}
          >
            <QrCode size={15} style={{ marginRight: "6px" }} />
            {t("dashboard.viewQR") || "View QR"}
          </button>
          
          <button
            onClick={() => navigate(`/profile/${profile.id}/edit`)}
            className="btn-ghost"
            style={{ padding: "10px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title={t("dashboard.edit")}
          >
            <Edit size={16} />
          </button>
          
          <button
            onClick={() => navigate(`/emergency/${profile.id}`)}
            className="btn-ghost"
            style={{ padding: "10px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-red)", borderColor: "rgba(230,57,70,0.3)" }}
            title={t("dashboard.emergency")}
          >
            <Zap size={16} />
          </button>
          
          <button
            onClick={() => navigate(`/chat/${profile.id}`)}
            className="btn-ghost"
            style={{ padding: "10px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="AI Chat"
          >
            <MessageSquare size={16} />
          </button>
        </div>

        {/* Row 2: Secondary / Feature Actions */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => navigate(`/recommendations/${profile.id}`)}
            className="btn-ghost"
            style={{ flex: 1, padding: "8px 6px", fontSize: "11px", display: "flex", flexDirection: "row", gap: "4px", alignItems: "center", justifyContent: "center" }}
            title={t("dashboard.aiInsights")}
          >
            <span style={{ fontSize: "13px" }}>🤖</span>
            <span style={{ fontWeight: 600 }}>Insights</span>
          </button>
          
          <button
            onClick={() => navigate(`/calendar/${profile.id}`)}
            className="btn-ghost"
            style={{ flex: 1, padding: "8px 6px", fontSize: "11px", display: "flex", flexDirection: "row", gap: "4px", alignItems: "center", justifyContent: "center" }}
            title={t("dashboard.calendar")}
          >
            <span style={{ fontSize: "13px" }}>📅</span>
            <span style={{ fontWeight: 600 }}>Calendar</span>
          </button>
          
          <button
            onClick={() => navigate(`/vitals/${profile.id}`)}
            className="btn-ghost"
            style={{ flex: 1, padding: "8px 6px", fontSize: "11px", display: "flex", flexDirection: "row", gap: "4px", alignItems: "center", justifyContent: "center" }}
            title={t("dashboard.vitals")}
          >
            <span style={{ fontSize: "13px" }}>⌚</span>
            <span style={{ fontWeight: 600 }}>Vitals</span>
          </button>
          
          <button
            onClick={triggerSOS}
            className="btn-primary"
            style={{
              flex: 1.1,
              padding: "8px 6px",
              fontSize: "11px",
              background: "var(--accent-red)",
              borderColor: "var(--accent-red)",
              display: "flex",
              flexDirection: "row",
              gap: "4px",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(230,57,70,0.3)",
            }}
            title={t("dashboard.sos")}
          >
            <span style={{ fontSize: "13px" }}>🆘</span>
            <span>SOS</span>
          </button>
          
          <button
            onClick={() => navigate(`/sos-history/${profile.id}`)}
            className="btn-ghost"
            style={{ width: "38px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            title="SOS History"
          >
            <span style={{ fontSize: "15px" }}>📜</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ textAlign: "center", padding: "80px 20px" }}
  >
    <div
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "20px",
        background: "rgba(230, 57, 70, 0.1)",
        border: "1px solid rgba(230, 57, 70, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
      }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 5v26M5 18h26" stroke="#E63946" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <h2
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "24px",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "12px",
      }}
    >
      No profiles yet
    </h2>
    <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "15px" }}>
      Create one for someone you love. In an emergency, it could save their life.
    </p>
    <Link to="/profile/create" style={{ textDecoration: "none" }}>
      <button className="btn-primary" style={{ padding: "13px 28px" }}>
        <Plus size={18} />
        Create First Profile
      </button>
    </Link>
  </motion.div>
);

export default Dashboard;
