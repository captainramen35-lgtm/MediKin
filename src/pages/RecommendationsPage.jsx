import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";
import { generateAIRecommendations } from "../utils/groq";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldAlert, Award } from "lucide-react";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { SkeletonBrief } from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";

const RecommendationsPage = () => {
  const { t, i18n } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { profile, loading: profileLoading } = useProfile(profileId);

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastGenerated, setLastGenerated] = useState(null);

  const fetchRecommendations = async (forceRefresh = false) => {
    if (!profile) return;
    setLoading(true);

    try {
      // 1. Check if cached recommendations exist and are < 12 hours old
      const cached = profile.recommendations;
      const cachedTime = profile.recommendationsGeneratedAt?.toDate
        ? profile.recommendationsGeneratedAt.toDate()
        : profile.recommendationsGeneratedAt
        ? new Date(profile.recommendationsGeneratedAt)
        : null;

      const hoursOld = cachedTime ? (Date.now() - cachedTime) / (1000 * 60 * 60) : 999;

      if (!forceRefresh && cached && cached.length > 0 && hoursOld < 12) {
        setRecommendations(cached);
        setLastGenerated(cachedTime);
        setLoading(false);
        return;
      }

      // 2. Otherwise generate fresh from Groq
      const freshList = await generateAIRecommendations(profile, i18n.language);
      setRecommendations(freshList);
      const now = new Date();
      setLastGenerated(now);

      // Cache to Firestore
      await updateDoc(doc(db, "profiles", profileId), {
        recommendations: freshList,
        recommendationsGeneratedAt: now,
      });

      addToast("AI Recommendations updated!", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to generate AI Recommendations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchRecommendations();
    }
  }, [profile]);

  const getPriorityStyles = (p) => {
    const priority = p ? p.toLowerCase() : "";
    if (priority === "high") {
      return { borderLeft: "4px solid var(--accent-red)", badgeColor: "var(--accent-red)", bg: "rgba(230, 57, 70, 0.05)" };
    }
    if (priority === "medium") {
      return { borderLeft: "4px solid #F4A261", badgeColor: "#F4A261", bg: "rgba(244, 162, 97, 0.05)" };
    }
    return { borderLeft: "4px solid #2EC4B6", badgeColor: "#2EC4B6", bg: "rgba(46, 196, 182, 0.05)" };
  };

  const getCategoryEmoji = (c) => {
    const cat = c ? c.toLowerCase() : "";
    if (cat.includes("medication")) return "💊";
    if (cat.includes("diet")) return "🥗";
    if (cat.includes("lifestyle")) return "🏃";
    if (cat.includes("warning")) return "⚠️";
    return "📅";
  };

  if (profileLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <SkeletonBrief />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "80px 24px 60px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Back navigation */}
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-ghost"
          style={{
            marginBottom: "24px",
            padding: "8px 14px",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={16} />
          {t("nav.dashboard") || "Dashboard"}
        </button>

        {/* Disclaimer Banner */}
        <div
          style={{
            background: "rgba(244, 162, 97, 0.1)",
            border: "1px solid rgba(244, 162, 97, 0.25)",
            borderRadius: "16px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "32px",
          }}
        >
          <AlertTriangle size={24} color="#F4A261" style={{ flexShrink: 0 }} />
          <p style={{ color: "#ffd5b3", fontSize: "13.5px", lineHeight: 1.5, margin: 0 }}>
            {t("recommendations.disclaimer") ||
              "These recommendations are AI-generated based on profile data. Always consult your doctor before making any medical decisions."}
          </p>
        </div>

        {/* Desktop grid layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "32px",
              alignItems: "start",
            }}
            className="recommendations-container"
          >
            {/* LEFT COLUMN: Patient Summary */}
            {profile && (
              <div
                style={{
                  position: "sticky",
                  top: "96px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                className="summary-col"
              >
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "16px",
                    }}
                  >
                    Patient Profile
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {profile.patient?.name}
                    </span>
                    <BloodGroupBadge bloodGroup={profile.patient?.bloodGroup} size="sm" />
                  </div>

                  {/* Conditions List */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>
                      Active Conditions
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {profile.conditions?.map((c) => (
                        <span key={c} className="pill pill-blue" style={{ fontSize: "11px", padding: "3px 8px" }}>
                          {c}
                        </span>
                      ))}
                      {(!profile.conditions || profile.conditions.length === 0) && (
                        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>None recorded</span>
                      )}
                    </div>
                  </div>

                  {/* Medications Count */}
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase" }}>
                      Medications
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                      {profile.medications?.length || 0} active medications
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
                  <button
                    onClick={() => fetchRecommendations(true)}
                    className="btn-primary"
                    disabled={loading}
                    style={{ width: "100%", justifyContent: "center", marginBottom: "12px" }}
                  >
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} style={{ marginRight: "6px" }} />
                    {t("recommendations.refresh") || "Refresh Insights"}
                  </button>

                  {lastGenerated && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {t("recommendations.lastGenerated") || "Last generated"}:{" "}
                      {lastGenerated.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {lastGenerated.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: AI Recommendations Feed */}
            <div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Award size={24} color="var(--accent-red)" />
                {t("recommendations.title") || "AI Health Recommendations"}
              </h2>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="glass-card skeleton"
                      style={{ height: "140px", borderRadius: "16px" }}
                    />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {recommendations.map((rec, index) => {
                    const styles = getPriorityStyles(rec.priority);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className="glass-card"
                        style={{
                          padding: "24px",
                          borderLeft: styles.borderLeft,
                          background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, ${styles.bg} 100%)`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {/* Category badge */}
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>{getCategoryEmoji(rec.category)}</span>
                            <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {rec.category}
                            </span>
                          </span>

                          {/* Priority badge */}
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 8px",
                              borderRadius: "100px",
                              border: `1px solid ${styles.badgeColor}`,
                              color: styles.badgeColor,
                            }}
                          >
                            {rec.priority}
                          </span>
                        </div>

                        <h4
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "8px",
                          }}
                        >
                          {rec.title}
                        </h4>

                        <p
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          {rec.body}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="glass-card"
                  style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}
                >
                  No insights generated yet. Click "Refresh Insights" to generate.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .recommendations-container {
            grid-template-columns: 1fr !important;
          }
          .summary-col {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RecommendationsPage;
