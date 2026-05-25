import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReactToPrint } from "react-to-print";
import { getProfile, updateCachedBrief } from "../utils/firestore";
import { generateEmergencyBrief } from "../utils/groq";
import { formatDate, daysSince } from "../utils/helpers";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { SkeletonBrief } from "../components/SkeletonLoader";
import {
  AlertTriangle,
  Printer,
  Phone,
  Zap,
  Clock,
  Pill,
  ShieldAlert,
  Scissors,
  Droplets,
  FileText,
  Eye,
  Download,
  Calendar,
  Activity,
  X,
} from "lucide-react";

const BRIEF_CACHE_HOURS = 24;

const EmergencyBrief = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [brief, setBrief] = useState("");
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeDoc, setActiveDoc] = useState(null);
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Emergency Brief — ${profile?.patient?.name || "Patient"}`,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProfile(id);
        if (!data) {
          setError("Profile not found. Please check the QR code.");
          return;
        }
        setProfile(data);

        // Check cache
        const cached = data.cachedBrief;
        if (cached && cached.text && cached.generatedAt) {
          const generatedDate = cached.generatedAt.toDate
            ? cached.generatedAt.toDate()
            : new Date(cached.generatedAt);
          const hoursOld = (Date.now() - generatedDate) / (1000 * 60 * 60);

          if (hoursOld < BRIEF_CACHE_HOURS) {
            setBrief(cached.text);
            setCriticalAlerts(cached.criticalAlerts || []);
            setLoading(false);
            return;
          }
        }

        // Generate fresh brief
        setLoading(false);
        setBriefLoading(true);
        const { brief: newBrief, criticalAlerts: newAlerts } = await generateEmergencyBrief(data);
        setBrief(newBrief);
        setCriticalAlerts(newAlerts);

        // Cache to Firestore (non-blocking)
        updateCachedBrief(id, newBrief, newAlerts).catch(console.error);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setBriefLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#060910", padding: "0 0 60px" }}>
        <div style={{ height: "64px", background: "rgba(230,57,70,0.15)", marginBottom: "24px" }} className="skeleton" />
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 24px" }}>
          <SkeletonBrief />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060910",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        <AlertTriangle size={48} color="#E63946" />
        <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#F0F4FF", fontSize: "22px" }}>
          {error}
        </h2>
        <p style={{ color: "#8892A4", fontSize: "14px" }}>
          Please verify the QR code and try again.
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const patient = profile.patient || {};
  const lastUpdatedDays = profile.lastUpdated
    ? daysSince(profile.lastUpdated)
    : null;

  // Safe escape function for regex characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Highlight dangerous words in red
  const highlightDangerousText = (text) => {
    if (!text) return "";
    const dangerous = [
      ...((profile.allergies || []).map((a) => typeof a === "string" ? a : "")),
      ...(profile.medications || []).map((m) => m?.name || ""),
      "ALLERGY",
      "DO NOT",
      "HIGH RISK",
      "WARFARIN",
      "INSULIN",
      "ANTICOAGULANT",
    ].filter(Boolean);

    let result = text;
    dangerous.forEach((word) => {
      try {
        const escaped = escapeRegExp(word);
        const regex = new RegExp(`(${escaped})`, "gi");
        result = result.replace(
          regex,
          `<span style="color: #E63946; font-weight: 600;">$1</span>`
        );
      } catch (e) {
        console.error("Error highlighting dangerous word:", word, e);
      }
    });
    return result;
  };

  return (
    <div
      ref={printRef}
      style={{
        minHeight: "100vh",
        background: "#060910",
        paddingBottom: "60px",
      }}
    >
      {/* TOP BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(230, 57, 70, 0.25) 0%, rgba(180, 20, 35, 0.3) 100%)",
          borderBottom: "1px solid rgba(230, 57, 70, 0.3)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Zap size={20} color="#E63946" />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              color: "#E63946",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Emergency Medical Brief — MediKin
          </span>
        </div>

        {/* Center: Patient name + blood group */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#F0F4FF",
            }}
          >
            {patient.name}
          </span>
          <BloodGroupBadge bloodGroup={patient.bloodGroup} size="md" />
          {patient.gender && (
            <span style={{ fontSize: "13px", color: "#8892A4" }}>{patient.gender}</span>
          )}
        </div>

        {/* Right: Last updated */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={14} color="#8892A4" />
          <span style={{ fontSize: "12px", color: "#8892A4" }}>
            {lastUpdatedDays !== null
              ? lastUpdatedDays === 0
                ? "Updated today"
                : `Updated ${lastUpdatedDays} day${lastUpdatedDays > 1 ? "s" : ""} ago`
              : "—"}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 24px" }}>
        {/* CRITICAL ALERTS */}
        {criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(230, 57, 70, 0.1)",
              backdropFilter: "blur(12px)",
              border: "2px solid rgba(230, 57, 70, 0.4)",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <ShieldAlert size={22} color="#E63946" />
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#E63946",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Critical Alerts — Read First
              </h2>
            </div>
            {criticalAlerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid rgba(230, 57, 70, 0.15)" : "none",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#E63946",
                    marginTop: "7px",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    color: "#ffb3b9",
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  {alert}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* AI BRIEF */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ padding: "24px", marginBottom: "20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Zap size={16} color="#4361EE" />
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "#4361EE",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Medical Summary
            </h2>
            {briefLoading && (
              <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="typing-dot"
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4361EE",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {briefLoading ? (
            <div>
              <div className="skeleton" style={{ height: "16px", borderRadius: "6px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "16px", borderRadius: "6px", marginBottom: "8px", width: "90%" }} />
              <div className="skeleton" style={{ height: "16px", borderRadius: "6px", width: "75%" }} />
            </div>
          ) : (
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#d0d8ee",
              }}
              dangerouslySetInnerHTML={{ __html: highlightDangerousText(brief) }}
            />
          )}
        </motion.div>

        {/* DATA GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* Blood Group */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Droplets size={16} color="#8892A4" />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600 }}>
                Blood Group
              </span>
            </div>
            <BloodGroupBadge bloodGroup={patient.bloodGroup} size="lg" />
            {patient.dob && (
              <p style={{ fontSize: "13px", color: "#8892A4" }}>
                DOB: {patient.dob}
              </p>
            )}
          </motion.div>

          {/* Medications */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Pill size={16} color="#8892A4" />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600 }}>
                Active Medications
              </span>
            </div>
            {profile.medications && profile.medications.length > 0 ? (
              profile.medications.map((med, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 0",
                    borderBottom: i < profile.medications.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#F0F4FF" }}>
                    {med.name}
                    {med.dose && <span style={{ color: "#8892A4", fontWeight: 400, marginLeft: "6px" }}>{med.dose}</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8892A4" }}>{med.frequency}</div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: "#8892A4" }}>None recorded</p>
            )}
          </motion.div>

          {/* Allergies */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card"
            style={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <AlertTriangle size={16} color="#E63946" />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600 }}>
                Known Allergies
              </span>
            </div>
            {profile.allergies && profile.allergies.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {profile.allergies.map((a) => (
                  <span key={a} className="pill pill-red" style={{ fontSize: "13px" }}>
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "14px", color: "#8892A4" }}>None recorded</p>
            )}
          </motion.div>

          {/* Surgeries */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
            style={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Scissors size={16} color="#8892A4" />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600 }}>
                Past Surgeries
              </span>
            </div>
            {profile.surgeries && profile.surgeries.length > 0 ? (
              profile.surgeries.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 0",
                    borderBottom: i < profile.surgeries.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    fontSize: "14px",
                    color: "#F0F4FF",
                  }}
                >
                  {s.name}
                  {s.year && <span style={{ color: "#8892A4", marginLeft: "8px" }}>{s.year}</span>}
                </div>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: "#8892A4" }}>None recorded</p>
            )}
          </motion.div>
        </div>

        {/* CONDITIONS */}
        {profile.conditions && profile.conditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="glass-card"
            style={{ padding: "24px", marginBottom: "20px" }}
          >
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600, marginBottom: "14px" }}>
              Medical Conditions
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {profile.conditions.map((c) => (
                <span key={c} className="pill pill-blue">
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* MEDICAL DOCUMENTS & SCANS */}
        {profile.documents && profile.documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            className="glass-card"
            style={{ padding: "24px", marginBottom: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <FileText size={16} color="#8892A4" />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600 }}>
                Previous Medical Documents & Scans
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {profile.documents.map((doc) => {
                const isScan = doc.type === "Scan";
                const isBlood = doc.type === "Blood Test";
                const DocIcon = isScan ? Activity : isBlood ? Droplets : FileText;
                const badgeColor = isScan
                  ? { bg: "rgba(244,162,97,0.15)", color: "#F4A261" }
                  : isBlood
                  ? { bg: "rgba(230,57,70,0.12)", color: "#ff8b94" }
                  : { bg: "rgba(67,97,238,0.15)", color: "#7b9cff" };

                return (
                  <div
                    key={doc.id}
                    style={{
                      padding: "16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: badgeColor.color,
                          flexShrink: 0,
                        }}
                      >
                        <DocIcon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#F0F4FF",
                            margin: "0 0 4px 0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {doc.title}
                        </h4>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: badgeColor.bg,
                              color: badgeColor.color,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                            }}
                          >
                            {doc.type}
                          </span>
                          <span style={{ fontSize: "11px", color: "#8892A4" }}>
                            {doc.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveDoc(doc)}
                      className="btn-ghost"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        padding: "8px",
                        fontSize: "12.5px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    >
                      <Eye size={13} style={{ marginRight: "6px" }} />
                      View Document
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* EMERGENCY CONTACTS */}
        {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card"
            style={{ padding: "24px", marginBottom: "24px" }}
          >
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#8892A4", fontWeight: 600, marginBottom: "16px" }}>
              Emergency Contacts
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {profile.emergencyContacts.map((contact, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#F0F4FF", marginBottom: "3px" }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8892A4" }}>
                      {contact.relation} · {contact.phone}
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone?.replace(/\D/g, "")}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(46, 196, 182, 0.15)",
                      border: "1px solid rgba(46, 196, 182, 0.3)",
                      color: "#2EC4B6",
                      textDecoration: "none",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                    title={`Call ${contact.name}`}
                  >
                    <Phone size={16} />
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Print button */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }} className="no-print">
          <button onClick={handlePrint} className="btn-ghost" style={{ fontSize: "14px" }}>
            <Printer size={16} />
            Print This Brief
          </button>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "32px",
            fontSize: "12px",
            color: "#8892A4",
            lineHeight: 1.6,
          }}
        >
          Information provided by patient's family via MediKin.{" "}
          <strong style={{ color: "#F0F4FF" }}>Always verify with family when possible.</strong>
          <br />
          This is not a substitute for professional medical judgment.
        </p>
      </div>

      {/* Premium Lightbox Modal Viewer */}
      <AnimatePresence>
        {activeDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(6, 9, 16, 0.95)",
              backdropFilter: "blur(20px)",
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
              padding: "20px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                maxWidth: "1000px",
                width: "100%",
                margin: "0 auto 16px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#F0F4FF",
                    marginBottom: "4px",
                  }}
                >
                  {activeDoc.title}
                </h2>
                <p style={{ fontSize: "13px", color: "#8892A4", margin: 0 }}>
                  <span style={{
                    background: activeDoc.type === "Scan" ? "rgba(244,162,97,0.2)" : activeDoc.type === "Blood Test" ? "rgba(67,97,238,0.2)" : "rgba(255,255,255,0.08)",
                    color: activeDoc.type === "Scan" ? "#F4A261" : activeDoc.type === "Blood Test" ? "#5e81ff" : "#8892A4",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                    marginRight: "8px"
                  }}>
                    {activeDoc.type}
                  </span>
                  {activeDoc.date}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={activeDoc.fileData}
                  download={activeDoc.fileName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#F0F4FF",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  <Download size={14} /> Download
                </a>
                <button
                  onClick={() => setActiveDoc(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "rgba(230,57,70,0.15)",
                    border: "1px solid rgba(230,57,70,0.3)",
                    color: "#E63946",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                flex: 1,
                maxWidth: "1000px",
                width: "100%",
                margin: "0 auto",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "18px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeDoc.fileType === "application/pdf" ? (
                <iframe
                  src={activeDoc.fileData}
                  title={activeDoc.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    borderRadius: "18px",
                    background: "white",
                  }}
                />
              ) : (
                <img
                  src={activeDoc.fileData}
                  alt={activeDoc.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyBrief;
