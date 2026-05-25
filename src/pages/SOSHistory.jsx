import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useProfile } from "../hooks/useProfile";
import { ArrowLeft, Clock, MapPin, Users, Send, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { SkeletonBrief } from "../components/SkeletonLoader";

const SOSHistory = () => {
  const { t } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile(profileId);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, "sosLogs"),
          where("profileId", "==", profileId)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Sort client-side by triggeredAt desc (handles Timestamp or raw Date/strings)
        const sortedList = list.sort((a, b) => {
          const aTime = a.triggeredAt?.toMillis ? a.triggeredAt.toMillis() : (a.triggeredAt?.seconds ? a.triggeredAt.seconds * 1000 : new Date(a.triggeredAt).getTime() || 0);
          const bTime = b.triggeredAt?.toMillis ? b.triggeredAt.toMillis() : (b.triggeredAt?.seconds ? b.triggeredAt.seconds * 1000 : new Date(b.triggeredAt).getTime() || 0);
          return bTime - aTime;
        });
        
        setLogs(sortedList);
      } catch (e) {
        console.error("Error loading SOS logs:", e);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();
  }, [profileId]);

  if (profileLoading || loadingLogs) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "36px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              SOS Alert History
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Timeline of emergency alerts triggered for this profile.
            </p>
          </div>

          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                {profile.patient?.name}
              </span>
              <BloodGroupBadge bloodGroup={profile.patient?.bloodGroup} size="sm" />
            </div>
          )}
        </div>

        {/* SOS Summary Card */}
        {logs.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(230, 57, 70, 0.1) 0%, rgba(12, 18, 34, 0.6) 100%)",
              border: "1px solid rgba(230, 57, 70, 0.25)",
              borderRadius: "20px",
              padding: "24px",
              marginBottom: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                Emergency Dispatch Summary
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "'Syne', sans-serif" }}>
                {logs.length} {logs.length === 1 ? "Alert Sent" : "Alerts Sent"}
              </h2>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Last Activated Date & Time
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#2EC4B6", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} />
                <span>
                  {(() => {
                    const lastLog = logs[0];
                    const d = lastLog.triggeredAt?.toDate ? lastLog.triggeredAt.toDate() : new Date(lastLog.triggeredAt);
                    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SOS Logs Timeline */}
        {logs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {logs.map((log, index) => {
              const triggeredDate = log.triggeredAt?.toDate
                ? log.triggeredAt.toDate()
                : new Date(log.triggeredAt);

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card"
                  style={{
                    padding: "24px",
                    borderLeft: "4px solid var(--accent-red)",
                    position: "relative",
                  }}
                >
                  {/* Status Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: "24px",
                      right: "24px",
                      background: "rgba(230, 57, 70, 0.15)",
                      border: "1px solid rgba(230, 57, 70, 0.25)",
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--accent-red)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    SOS Triggered
                  </div>

                  {/* Trigger Date & Time */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      marginBottom: "16px",
                    }}
                  >
                    <Clock size={14} />
                    <span>
                      {triggeredDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {triggeredDate.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Location Info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "16px",
                    }}
                  >
                    <MapPin size={16} color="var(--accent-blue)" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        Last Known Location
                      </div>
                      {log.location ? (
                        <a
                          href={log.locationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#7b9cff",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Google Maps Location ({log.location.lat.toFixed(5)},{" "}
                          {log.location.lng.toFixed(5)})
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                          Location unavailable — tracked via cellular connection
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contacts Alerted */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "16px",
                    }}
                  >
                    <Users size={16} color="#2EC4B6" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        Contacts Alerted
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--text-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {log.contactsNotified?.join(", ") || "No contacts registered"}
                      </div>
                    </div>
                  </div>

                  {/* Channels Used */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <Send size={16} color="#9D4EDD" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "8px",
                        }}
                      >
                        Delivery Channels
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {log.channelsUsed?.includes("call") && (
                          <span
                            title="Automated Call Alert"
                            style={{
                              background: "rgba(244, 162, 97, 0.15)",
                              border: "1px solid rgba(244, 162, 97, 0.3)",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "#F4A261",
                              fontWeight: 600,
                            }}
                          >
                            📞 Call
                          </span>
                        )}
                        {log.channelsUsed?.includes("whatsapp") && (
                          <span
                            title="WhatsApp sandbox alert"
                            style={{
                              background: "rgba(46, 196, 182, 0.15)",
                              border: "1px solid rgba(46, 196, 182, 0.3)",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "#2EC4B6",
                              fontWeight: 600,
                            }}
                          >
                            💬 WhatsApp
                          </span>
                        )}
                        {log.channelsUsed?.includes("sms") && (
                          <span
                            title="SMS alert"
                            style={{
                              background: "rgba(67, 97, 238, 0.15)",
                              border: "1px solid rgba(67, 97, 238, 0.3)",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "#7b9cff",
                              fontWeight: 600,
                            }}
                          >
                            📱 SMS
                          </span>
                        )}
                        {log.channelsUsed?.includes("email") && (
                          <span
                            title="Email alert"
                            style={{
                              background: "rgba(157, 78, 221, 0.15)",
                              border: "1px solid rgba(157, 78, 221, 0.3)",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "#c77dff",
                              fontWeight: 600,
                            }}
                          >
                            📧 Email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <AlertCircle
              size={48}
              color="var(--text-muted)"
              style={{ display: "block", margin: "0 auto 16px" }}
            />
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "18px",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              {t("sos.noAlerts") || "No SOS alerts triggered yet"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
              No SOS emergency events have been logged for this family member's profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSHistory;
