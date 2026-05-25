import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, QrCode, Zap, Heart, Shield, Activity, ArrowRight, Scan, PhoneCall, Sparkles, Calendar as CalendarIcon } from "lucide-react";

// EKG SVG path
const EKG_PATH = "M 0 50 L 60 50 L 70 50 L 80 20 L 90 80 L 100 10 L 110 90 L 120 50 L 130 50 L 800 50";

const Landing = () => {
  const howRef = useRef(null);
  const howInView = useInView(howRef, { once: true, margin: "-100px" });

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(230, 57, 70, 0.12) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* EKG Animation */}
        <svg
          style={{
            position: "absolute",
            bottom: "15%",
            left: 0,
            right: 0,
            width: "100%",
            height: "80px",
            opacity: 0.15,
            pointerEvents: "none",
          }}
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          <path
            d={EKG_PATH}
            fill="none"
            stroke="#E63946"
            strokeWidth="2"
            className="ekg-path"
          />
        </svg>

        {/* Hero content */}
        <div style={{ position: "relative", maxWidth: "780px" }}>
          {/* Brand Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, rgba(230, 57, 70, 0.15) 0%, rgba(67, 97, 238, 0.15) 100%)",
              border: "1px solid rgba(230, 57, 70, 0.35)",
              borderRadius: "100px",
              padding: "8px 20px",
              marginBottom: "32px",
              fontSize: "16px",
              fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              color: "white",
              boxShadow: "0 4px 20px rgba(230, 57, 70, 0.15)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                background: "var(--accent-red)",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span>MediKin</span>
          </motion.div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(34px, 5.5vw, 60px)",
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: "32px",
              letterSpacing: "-1px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ color: "var(--text-primary)" }}
            >
              Someone you love has a
            </motion.span>
            
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                color: "#E63946",
                textShadow: "0 0 40px rgba(230,57,70,0.2)",
                fontWeight: 900,
              }}
            >
              Heart Attack.
            </motion.span>
            
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              style={{ color: "var(--text-primary)" }}
            >
              Nobody remembers their
            </motion.span>
            
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              style={{
                color: "#E63946",
                textShadow: "0 0 40px rgba(230,57,70,0.2)",
                fontWeight: 900,
              }}
            >
              medications.
            </motion.span>
          </h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              marginBottom: "44px",
              maxWidth: "600px",
              margin: "0 auto 44px",
            }}
          >
            MediKin carries their complete medical history as a QR code.{" "}
            <strong style={{ color: "var(--text-primary)" }}>Managed by family.</strong>{" "}
            Read by any doctor. In the moment that matters.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link to="/signup" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(230, 57, 70, 0.45)" }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{ padding: "15px 32px", fontSize: "16px" }}
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link to="/scan" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost"
                style={{ padding: "15px 32px", fontSize: "16px" }}
              >
                <Scan size={18} />
                Scan a QR Code
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        ref={howRef}
        style={{
          padding: "100px 24px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: "64px" }}
          >
            <p style={{ color: "var(--accent-red)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
              How It Works
            </p>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              From family to frontline,{" "}
              <span style={{ color: "var(--accent-red)" }}>instantly</span>
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              {
                num: "01",
                icon: Users,
                title: "Family Creates Profile",
                desc: "Add blood group, conditions, medications, allergies, past surgeries, and emergency contacts. Multiple family members can update it anytime.",
                color: "#4361EE",
              },
              {
                num: "02",
                icon: QrCode,
                title: "QR Code Generated Instantly",
                desc: "A unique QR code is generated that links directly to the emergency brief. Print it, save it, or share the link — no app needed to scan.",
                color: "#2EC4B6",
              },
              {
                num: "03",
                icon: Zap,
                title: "Doctor Scans, AI Brief Appears",
                desc: "Any doctor or nurse scans the QR. Within seconds, an AI-generated emergency brief appears — allergies, medications, critical alerts. Readable in 30 seconds.",
                color: "#E63946",
              },
            ].map(({ num, icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 40 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="glass-card"
                style={{ padding: "32px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: `rgba(${color === "#4361EE" ? "67,97,238" : color === "#2EC4B6" ? "46,196,182" : "230,57,70"}, 0.15)`,
                      border: `1px solid ${color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={24} color={color} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "48px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.05)",
                      lineHeight: 1,
                    }}
                  >
                    {num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "10px",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANCED FEATURES */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ color: "var(--accent-red)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
              MediKin Premium Features
            </p>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              Advanced Emergency & <span style={{ color: "var(--accent-red)" }}>Health Guard</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "15px", marginTop: "12px", maxWidth: "600px", margin: "12px auto 0", lineHeight: 1.6 }}>
              Securing and optimizing your family's health with state-of-the-art tools and AI clinical intelligence.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                icon: PhoneCall,
                title: "1-Click Multi-Channel SOS",
                desc: "Pulsing SOS trigger instantly alerts all emergency contacts through automated calls, WhatsApp, SMS, and emails in parallel with real-time GPS coordinates.",
                color: "#E63946",
                badge: "Immediate Dispatch"
              },
              {
                icon: Sparkles,
                title: "AI Clinical Recommendations",
                desc: "Groq LLM-powered advisory engine scans your conditions and medications to output tailored, high-priority diet, lifestyle, and warning insights.",
                color: "#2EC4B6",
                badge: "AI Powered"
              },
              {
                icon: CalendarIcon,
                title: "Checkup Scheduler Calendar",
                desc: "Smart MONTH view calendar with AI suggested checkup cards that instantly pre-populate your routine appointments, complete with local browser alerts.",
                color: "#4361EE",
                badge: "Smart Sync"
              },
              {
                icon: Activity,
                title: "Google Fit Vitals Analyzer",
                desc: "Connect wearable trackers to chart heart rate, steps, and sleep trends with condition-aware AI clinical alerts checking for anomalies.",
                color: "#9D4EDD",
                badge: "Wearables Integration"
              }
            ].map(({ icon: Icon, title, desc, color, badge }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card"
                style={{
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "20px",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  background: "rgba(255, 255, 255, 0.01)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Background soft glow */}
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: color,
                    opacity: 0.08,
                    filter: "blur(20px)",
                    pointerEvents: "none"
                  }}
                />

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: `rgba(${color === "#E63946" ? "230,57,70" : color === "#2EC4B6" ? "46,196,182" : color === "#4361EE" ? "67,97,238" : "157,78,221"}, 0.12)`,
                        border: `1px solid ${color}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} color={color} />
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: color,
                        letterSpacing: "0.5px",
                        background: `rgba(${color === "#E63946" ? "230,57,70" : color === "#2EC4B6" ? "46,196,182" : color === "#4361EE" ? "67,97,238" : "157,78,221"}, 0.08)`,
                        padding: "3px 8px",
                        borderRadius: "100px",
                        border: `1px solid ${color}15`
                      }}
                    >
                      {badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "10px",
                    }}
                  >
                    {title}
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO PREVIEW */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ color: "var(--accent-blue)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
              Live Preview
            </p>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(26px, 3.5vw, 38px)",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              What a doctor sees in seconds
            </h2>
          </div>

          {/* Mock emergency brief */}
          <div
            style={{
              background: "#060910",
              border: "1px solid rgba(230, 57, 70, 0.3)",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Banner */}
            <div
              style={{
                background: "rgba(230, 57, 70, 0.2)",
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(230, 57, 70, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={16} color="#E63946" />
                <span style={{ color: "#E63946", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Emergency Medical Brief — MediKin
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(230, 57, 70, 0.15)",
                  border: "1px solid rgba(230, 57, 70, 0.25)",
                  borderRadius: "100px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  color: "#ff9aa1",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E63946" }} />
                Generated in 1.2s
              </div>
            </div>

            <div style={{ padding: "24px", filter: "blur(2.5px)", userSelect: "none" }}>
              {/* Critical alerts mock */}
              <div
                style={{
                  background: "rgba(230, 57, 70, 0.1)",
                  border: "1px solid rgba(230, 57, 70, 0.3)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Shield size={16} color="#E63946" />
                  <span style={{ color: "#E63946", fontWeight: 700, fontSize: "13px", textTransform: "uppercase" }}>
                    Critical Alerts — Read First
                  </span>
                </div>
                <div style={{ color: "#ffb3b9", fontSize: "14px", marginBottom: "6px" }}>
                  • Patient is on Warfarin — HIGH BLEEDING RISK
                </div>
                <div style={{ color: "#ffb3b9", fontSize: "14px" }}>
                  • ALLERGY: Penicillin — DO NOT ADMINISTER
                </div>
              </div>

              {/* AI brief mock */}
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ fontSize: "14px", color: "#d0d8ee", lineHeight: 1.8 }}>
                  Patient is a 67-year-old diabetic male with a history of hypertension and atrial fibrillation. Currently on{" "}
                  <span style={{ color: "#E63946" }}>Warfarin</span> (anticoagulant), Metformin, and Lisinopril.{" "}
                  <span style={{ color: "#E63946" }}>CRITICAL ALLERGY to Penicillin</span> — anaphylactic reaction reported. Last hospitalization was cardiac, 2022.
                </p>
              </div>

              {/* Grid mock */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {["O+", "Metformin 500mg · Warfarin 5mg · Lisinopril 10mg", "Penicillin · Aspirin", "Appendectomy (2018) · Cardiac Stent (2022)"].map((content, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#8892A4", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {["Blood Group", "Active Medications", "Known Allergies", "Past Surgeries"][i]}
                    </div>
                    <div style={{ fontSize: "14px", color: "#F0F4FF" }}>{content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Preview blurred for privacy — create a profile to see a live brief
          </p>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Start protecting your family today.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "17px", marginBottom: "36px" }}>
            It takes 5 minutes. It could save a life.
          </p>
          <Link to="/signup" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(230, 57, 70, 0.45)" }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ padding: "16px 40px", fontSize: "17px" }}
            >
              Create a Free Profile
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "32px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--accent-red)",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
            MediKin
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            — Your complete medical history, carried as a QR code.
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Built for emergencies. Built with love. ❤️
        </p>
      </footer>

      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
