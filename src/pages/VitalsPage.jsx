import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";
import { generateAIVitalsAnalysis } from "../utils/groq";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Activity,
  Heart,
  Moon,
  RefreshCw,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { SkeletonBrief } from "../components/SkeletonLoader";

const VitalsPage = () => {
  const { t, i18n } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { profile, loading: profileLoading } = useProfile(profileId);

  // States
  const [token, setToken] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [vitals, setVitals] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Google Fit Configuration
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID;
  const FITNESS_API = "https://www.googleapis.com/fitness/v1/users/me";

  useEffect(() => {
    // 1. Check for token in hash (redirect from Google OAuth)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        localStorage.setItem("google_fit_token", accessToken);
        setToken(accessToken);
        // Clear hash from URL
        window.history.replaceState(null, null, " ");
        addToast("Google Fit connected successfully!", "success");

        if (profileId) {
          updateDoc(doc(db, "profiles", profileId), {
            googleFitConnected: true,
          }).catch(console.error);
        }
      }
    } else {
      const savedToken = localStorage.getItem("google_fit_token");
      if (savedToken) setToken(savedToken);
    }

    // Check if demo mode was preferred
    const savedDemo = localStorage.getItem(`demo_mode_${profileId}`);
    if (savedDemo === "true") setDemoMode(true);
  }, [profileId]);

  // Sync Vitals trigger
  const syncVitals = async (force = false) => {
    if (!profile) return;
    setSyncing(true);

    try {
      let stepsToday = 0;
      let heartRateToday = 72;
      let sleepToday = 7.0;

      if (demoMode) {
        // Simulated realistic vitals
        stepsToday = Math.floor(6500 + Math.random() * 4500);
        heartRateToday = Math.floor(68 + Math.random() * 22);
        sleepToday = Number((6.0 + Math.random() * 2.2).toFixed(1));
      } else if (token) {
        // Real API Calls (fallback if fetch fails / token invalid)
        try {
          const startOfDay = new Date().setHours(0, 0, 0, 0);
          const now = Date.now();

          // Fetch Steps
          const stepsRes = await fetch(`${FITNESS_API}/dataset:aggregate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
              bucketByTime: { durationMillis: 86400000 },
              startTimeMillis: startOfDay,
              endTimeMillis: now,
            }),
          });
          if (stepsRes.ok) {
            const stepsData = await stepsRes.json();
            stepsToday =
              stepsData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
          }

          // Fetch Heart Rate
          const hrRes = await fetch(`${FITNESS_API}/dataset:aggregate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              aggregateBy: [{ dataTypeName: "com.google.heart_rate.bpm" }],
              bucketByTime: { durationMillis: 86400000 },
              startTimeMillis: now - 86400000,
              endTimeMillis: now,
            }),
          });
          if (hrRes.ok) {
            const hrData = await hrRes.json();
            heartRateToday = Math.round(
              hrData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 72
            );
          }

          // Fetch Sleep
          const sleepRes = await fetch(`${FITNESS_API}/dataset:aggregate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
              bucketByTime: { durationMillis: 86400000 },
              startTimeMillis: now - 86400000 * 2,
              endTimeMillis: now,
            }),
          });
          if (sleepRes.ok) {
            const sleepData = await sleepRes.json();
            const points = sleepData.bucket?.[0]?.dataset?.[0]?.point || [];
            const totalMs = points.reduce(
              (sum, p) => sum + (p.endTimeNanos - p.startTimeNanos) / 1e6,
              0
            );
            sleepToday = Number((totalMs / 3600000).toFixed(1));
            if (sleepToday <= 0) sleepToday = 6.8; // safe fallback
          }
        } catch (apiErr) {
          console.error("Google Fit API failure, using demo fallback:", apiErr);
          // If Token expired
          localStorage.removeItem("google_fit_token");
          setToken(null);
          addToast("Google Fit session expired. Re-connecting...", "warning");
          return;
        }
      } else {
        setSyncing(false);
        return;
      }

      const syncResult = {
        steps: stepsToday,
        heartRate: heartRateToday,
        sleep: sleepToday,
        lastSynced: new Date(),
      };

      setVitals(syncResult);

      // Save snapshots to subcollection
      await addDoc(collection(db, "profiles", profileId, "vitalsHistory"), {
        steps: stepsToday,
        heartRate: heartRateToday,
        sleep: sleepToday,
        date: new Date(),
      });

      // Update main profile with latest snapshot
      await updateDoc(doc(db, "profiles", profileId), {
        latestVitals: syncResult,
      });

      // Reload history and trigger Groq Analysis
      fetchHistory();
      triggerAIVitalsAnalysis(syncResult);
    } catch (e) {
      console.error(e);
      addToast("Failed to sync health vitals.", "error");
    } finally {
      setSyncing(false);
    }
  };

  // Fetch past vitals history for trend chart
  const fetchHistory = async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "profiles", profileId, "vitalsHistory"),
          orderBy("date", "desc")
        )
      );
      const list = snap.docs.map((d) => {
        const data = d.data();
        const dateVal = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        return {
          id: d.id,
          ...data,
          dateVal,
          dateStr: dateVal.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        };
      });

      // Only display 7 most recent snapshots in calendar chronological order
      const trendList = list.slice(0, 7).reverse();

      // If no logs, generate demo history
      if (trendList.length === 0) {
        const fakeHistory = Array.from({ length: 7 }).map((_, idx) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - idx));
          return {
            steps: Math.floor(5800 + Math.random() * 5000),
            heartRate: Math.floor(66 + Math.random() * 26),
            sleep: Number((5.5 + Math.random() * 3).toFixed(1)),
            dateStr: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          };
        });
        setHistory(fakeHistory);
      } else {
        setHistory(trendList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Groq AI Vitals analysis based on conditions
  const triggerAIVitalsAnalysis = async (currentVitals) => {
    setLoadingAnalysis(true);
    try {
      const analysis = await generateAIVitalsAnalysis(
        profile,
        currentVitals,
        i18n.language
      );
      setAiAnalysis(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Load snapshot data on profile load
  useEffect(() => {
    if (profile) {
      fetchHistory();
      if (profile.latestVitals) {
        const latTime = profile.latestVitals.lastSynced?.toDate
          ? profile.latestVitals.lastSynced.toDate()
          : new Date(profile.latestVitals.lastSynced);
        setVitals({
          ...profile.latestVitals,
          lastSynced: latTime,
        });
        triggerAIVitalsAnalysis(profile.latestVitals);
      } else if (demoMode) {
        syncVitals();
      }
    }
  }, [profile, demoMode]);

  // Google OAuth redirect trigger
  const handleConnectGoogleFit = () => {
    const scope = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
    ].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + "/vitals/" + profileId)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const toggleDemoMode = () => {
    const nextDemo = !demoMode;
    setDemoMode(nextDemo);
    localStorage.setItem(`demo_mode_${profileId}`, String(nextDemo));
    addToast(
      nextDemo ? "Switched to Vitals Demo Mode" : "Vitals Demo Mode deactivated",
      "info"
    );
  };

  if (profileLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <SkeletonBrief />
        </div>
      </div>
    );
  }

  const isConnected = token || demoMode;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "80px 24px 60px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
            paddingBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Health Vitals Dashboard
              </h1>
              {demoMode && (
                <span
                  style={{
                    background: "rgba(244, 162, 97, 0.15)",
                    border: "1px solid rgba(244, 162, 97, 0.3)",
                    color: "#F4A261",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "100px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Demo Mode
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Integrate steps, vitals and biometric analytics safely for emergency contexts.
            </p>
          </div>

          {isConnected && (
            <button
              onClick={() => syncVitals(true)}
              className="btn-primary"
              disabled={syncing}
              style={{ padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Vitals"}
            </button>
          )}
        </div>

        {/* CONNECT SCREEN */}
        {!isConnected ? (
          <div
            className="glass-card"
            style={{
              padding: "60px 40px",
              textAlign: "center",
              maxWidth: "500px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "rgba(67, 97, 238, 0.1)",
                color: "var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={36} />
            </div>

            <div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {t("wearable.connect") || "Connect Google Fit"}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                Connect to Google Fit to monitor step metrics, rest cycles, and active cardiac
                ranges directly in emergencies.
              </p>
            </div>

            <button
              onClick={handleConnectGoogleFit}
              className="btn-primary"
              style={{
                background: "#ffffff",
                color: "#1f2937",
                borderColor: "#ffffff",
                fontWeight: 600,
                width: "100%",
                justifyContent: "center",
                padding: "12px",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign In with Google
            </button>

            <div style={{ width: "100%", height: "1px", background: "var(--border)" }} />

            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
                Don't have a wearable connected?
              </p>
              <button
                onClick={toggleDemoMode}
                className="btn-ghost"
                style={{ fontSize: "13px", width: "100%", justifyContent: "center" }}
              >
                Launch Demo Mode Vitals
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE VITALS DASHBOARD */
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Vitals snapshot time */}
            {vitals && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {t("wearable.lastSync") || "Last synced"}:{" "}
                  {vitals.lastSynced
                    ? vitals.lastSynced.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) +
                      " " +
                      vitals.lastSynced.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>

                <button
                  onClick={toggleDemoMode}
                  className="btn-ghost"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                >
                  {demoMode ? "Switch to Real Fit" : "Toggle Demo Vitals"}
                </button>
              </div>
            )}

            {/* 2x2 Grid */}
            {vitals && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* 1. Steps Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: `4px solid ${
                      vitals.steps >= 8000
                        ? "#2EC4B6"
                        : vitals.steps >= 5000
                        ? "#F4A261"
                        : "var(--accent-red)"
                    }`,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      {t("wearable.steps") || "Steps Today"}
                    </span>
                    <span
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        fontFamily: "'Syne', sans-serif",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      {vitals.steps.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "6px",
                      }}
                    >
                      Goal: 10,000 steps
                    </span>
                  </div>

                  {/* Circular progress SVG */}
                  <div style={{ position: "relative", width: "70px", height: "70px" }}>
                    <svg style={{ transform: "rotate(-90deg)", width: "70px", height: "70px" }}>
                      <circle
                        cx="35"
                        cy="35"
                        r="28"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="35"
                        cy="35"
                        r="28"
                        stroke={
                          vitals.steps >= 8000
                            ? "#2EC4B6"
                            : vitals.steps >= 5000
                            ? "#F4A261"
                            : "var(--accent-red)"
                        }
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray="176"
                        strokeDashoffset={176 - (176 * Math.min(vitals.steps, 10000)) / 10000}
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Activity size={18} />
                    </div>
                  </div>
                </motion.div>

                {/* 2. Heart Rate Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: `4px solid ${
                      vitals.heartRate > 100 || vitals.heartRate < 50
                        ? "var(--accent-red)"
                        : profile.conditions?.some((c) =>
                            c.toLowerCase().includes("heart")
                          ) && vitals.heartRate > 90
                        ? "#F4A261"
                        : "#2EC4B6"
                    }`,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      {t("wearable.heartRate") || "Heart Rate"}
                    </span>
                    <span
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        fontFamily: "'Syne', sans-serif",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      {vitals.heartRate} <span style={{ fontSize: "14px", fontWeight: 500 }}>BPM</span>
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "6px",
                      }}
                    >
                      Normal range: 60 - 100 BPM
                    </span>
                  </div>

                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(230, 57, 70, 0.08)",
                      border: "1px solid rgba(230, 57, 70, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-red)",
                      animation: "loadingPulse 1.2s infinite",
                    }}
                  >
                    <Heart size={20} />
                  </div>
                </motion.div>

                {/* 3. Sleep Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: `4px solid ${
                      vitals.sleep >= 7
                        ? "#2EC4B6"
                        : vitals.sleep >= 6
                        ? "#F4A261"
                        : "var(--accent-red)"
                    }`,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      {t("wearable.sleep") || "Sleep Last Night"}
                    </span>
                    <span
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        fontFamily: "'Syne', sans-serif",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      {vitals.sleep} <span style={{ fontSize: "14px", fontWeight: 500 }}>HRS</span>
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "6px",
                      }}
                    >
                      Target: 7 - 9 hours
                    </span>
                  </div>

                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(157, 78, 221, 0.08)",
                      border: "1px solid rgba(157, 78, 221, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9D4EDD",
                    }}
                  >
                    <Moon size={20} />
                  </div>
                </motion.div>
              </div>
            )}

            {/* AI Vitals analysis Card */}
            {vitals && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card"
                style={{ padding: "24px" }}
              >
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--accent-blue)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "16px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Cpu size={15} />
                  Condition-Aware AI Vitals Analysis
                </h3>

                {loadingAnalysis ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="skeleton" style={{ height: "16px", width: "90%", borderRadius: "4px" }} />
                    <div className="skeleton" style={{ height: "16px", width: "70%", borderRadius: "4px" }} />
                  </div>
                ) : aiAnalysis.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {aiAnalysis.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "start",
                          gap: "10px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.02)",
                          borderLeft: `3px solid ${
                            item.severity === "Alert"
                              ? "var(--accent-red)"
                              : item.severity === "Watch"
                              ? "#F4A261"
                              : "#2EC4B6"
                          }`,
                        }}
                      >
                        <div style={{ marginTop: "2px", flexShrink: 0 }}>
                          {item.severity === "Alert" ? (
                            <AlertTriangle size={15} color="var(--accent-red)" />
                          ) : item.severity === "Watch" ? (
                            <Info size={15} color="#F4A261" />
                          ) : (
                            <CheckCircle size={15} color="#2EC4B6" />
                          )}
                        </div>
                        <span style={{ fontSize: "13.5px", color: "#d0d8ee", lineHeight: 1.5 }}>
                          {item.insight}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                    No analysis. Synced vitals are normal.
                  </p>
                )}
              </motion.div>
            )}

            {/* Recharts 7-day Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
              style={{ padding: "24px" }}
            >
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "24px",
                }}
              >
                7-Day Health Trend
              </h3>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="dateStr"
                      stroke="var(--text-muted)"
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--accent-red)"
                      style={{ fontSize: "11px" }}
                      domain={[50, 120]}
                      label={{
                        value: "BPM",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--text-muted)",
                        style: { fontSize: "10px" },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2EC4B6"
                      style={{ fontSize: "11px" }}
                      domain={[0, 15000]}
                      label={{
                        value: "Steps",
                        angle: 90,
                        position: "insideRight",
                        fill: "var(--text-muted)",
                        style: { fontSize: "10px" },
                      }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        background: "#0C1222",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="heartRate"
                      name="Heart Rate (BPM)"
                      stroke="var(--accent-red)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="steps"
                      name="Steps"
                      stroke="#2EC4B6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalsPage;
