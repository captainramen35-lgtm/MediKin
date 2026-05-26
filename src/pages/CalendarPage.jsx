import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";
import { generateAICheckups } from "../utils/groq";
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { hi } from "date-fns/locale/hi";
import { bn } from "date-fns/locale/bn";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Sparkles,
  Trash2,
  Check,
  X,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { SkeletonBrief } from "../components/SkeletonLoader";

const locales = {
  "en-US": enUS,
  "en-IN": enUS,
  "en": enUS,
  "hi": hi,
  "bn": bn,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarPage = () => {
  const { t, i18n } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { profile, loading: profileLoading } = useProfile(profileId);

  // States
  const [checkups, setCheckups] = useState([]);
  const [loadingCheckups, setLoadingCheckups] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Tabs: upcoming, past
  const [activeTab, setActiveTab] = useState("upcoming");

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCheckup, setSelectedCheckup] = useState(null); // for editing
  const [form, setForm] = useState({
    title: "",
    type: "Doctor Visit",
    date: "",
    time: "",
    doctor: "",
    hospital: "",
    notes: "",
    reminderDays: 1,
  });

  const checkupTypes = [
    "Blood Test",
    "Doctor Visit",
    "Medication Refill",
    "Scan/Imaging",
    "Vaccination",
    "Other",
  ];

  // Fetch all scheduled checkups
  const fetchCheckups = async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "profiles", profileId, "checkups"),
          orderBy("date", "asc")
        )
      );
      const list = snap.docs.map((d) => {
        const data = d.data();
        const dateVal = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        return {
          id: d.id,
          ...data,
          dateVal,
        };
      });
      setCheckups(list);

      // Check upcoming reminders on fetch complete
      checkCheckupReminders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCheckups(false);
    }
  };

  // Fetch AI Checkup Suggestions
  const fetchSuggestions = async () => {
    if (!profile) return;
    setLoadingSuggestions(true);

    try {
      // Use cached suggestions if < 12 hours old
      const cached = profile.aiCheckupSuggestions;
      const cachedTime = profile.aiCheckupSuggestionsGeneratedAt?.toDate
        ? profile.aiCheckupSuggestionsGeneratedAt.toDate()
        : profile.aiCheckupSuggestionsGeneratedAt
        ? new Date(profile.aiCheckupSuggestionsGeneratedAt)
        : null;

      const hoursOld = cachedTime ? (Date.now() - cachedTime) / (1000 * 60 * 60) : 999;

      if (Array.isArray(cached) && cached.length > 0 && hoursOld < 12) {
        setAiSuggestions(cached);
        setLoadingSuggestions(false);
        return;
      }

      // Query AI
      const freshSuggestions = await generateAICheckups(profile, i18n.language);
      const suggestionsArray = Array.isArray(freshSuggestions) ? freshSuggestions : [];
      setAiSuggestions(suggestionsArray);

      // Cache suggestions
      await updateDoc(doc(db, "profiles", profileId), {
        aiCheckupSuggestions: suggestionsArray,
        aiCheckupSuggestionsGeneratedAt: new Date(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchCheckups();
      fetchSuggestions();
    }
  }, [profile]);

  // Request notification permissions and push reminders
  function checkCheckupReminders(list) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    list.forEach((checkup) => {
      if (checkup.status !== "upcoming") return;

      const reminderDate = new Date(checkup.dateVal);
      reminderDate.setDate(reminderDate.getDate() - (checkup.reminderDays || 1));
      reminderDate.setHours(0, 0, 0, 0);

      // If reminder date is today, show notification
      if (reminderDate.getTime() === today.getTime()) {
        const hasNotified = localStorage.getItem(`notified_checkup_${checkup.id}`);
        if (!hasNotified && Notification.permission === "granted") {
          new Notification("MediKin Reminder 📅", {
            body: `Upcoming checkup: ${checkup.title} for ${profile.patient?.name} is scheduled on ${checkup.dateVal.toLocaleDateString()}`,
            icon: "/medikin-logo.png",
          });
          localStorage.setItem(`notified_checkup_${checkup.id}`, "true");
        }
      }
    });
  };

  // Pre-fill checkup creation from AI suggestion
  const handleScheduleSuggestion = (suggestion) => {
    setForm({
      title: suggestion.title,
      type: suggestion.type || "Doctor Visit",
      date: "",
      time: "",
      doctor: "",
      hospital: "",
      notes: suggestion.reason || "",
      reminderDays: 1,
    });
    setSelectedCheckup(null);
    setModalOpen(true);
  };

  // Submit checkup Form (Create/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      addToast("Please fill in title and date", "warning");
      return;
    }

    const dateObject = new Date(form.date);

    const checkupPayload = {
      title: form.title,
      type: form.type,
      date: dateObject,
      time: form.time,
      doctor: form.doctor,
      hospital: form.hospital,
      notes: form.notes,
      reminderDays: Number(form.reminderDays),
      status: selectedCheckup ? selectedCheckup.status : "upcoming",
      createdAt: serverTimestamp(),
    };

    try {
      if (selectedCheckup) {
        // Edit existing
        await updateDoc(
          doc(db, "profiles", profileId, "checkups", selectedCheckup.id),
          checkupPayload
        );
        addToast("Checkup updated successfully!", "success");
      } else {
        // Create new
        await addDoc(
          collection(db, "profiles", profileId, "checkups"),
          checkupPayload
        );
        addToast("Checkup scheduled successfully!", "success");
      }
      setModalOpen(false);
      fetchCheckups();
    } catch (err) {
      console.error(err);
      addToast("Failed to save checkup.", "error");
    }
  };

  // Mark checkup complete
  const handleComplete = async (checkup) => {
    try {
      await updateDoc(doc(db, "profiles", profileId, "checkups", checkup.id), {
        status: "completed",
      });
      addToast("Checkup marked complete! Good job.", "success");
      fetchCheckups();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete checkup
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this checkup?")) return;
    try {
      await deleteDoc(doc(db, "profiles", profileId, "checkups", id));
      addToast("Checkup deleted.", "success");
      fetchCheckups();
    } catch (e) {
      console.error(e);
    }
  };

  // Colors for events
  const getTypeColor = (type) => {
    const t = type ? type.toLowerCase() : "";
    if (t.includes("blood")) return { color: "#4361EE", bg: "rgba(67,97,238,0.15)", border: "rgba(67,97,238,0.3)" };
    if (t.includes("visit") || t.includes("doctor")) return { color: "#2EC4B6", bg: "rgba(46,196,182,0.15)", border: "rgba(46,196,182,0.3)" };
    if (t.includes("refill") || t.includes("medication")) return { color: "#F4A261", bg: "rgba(244,162,97,0.15)", border: "rgba(244,162,97,0.3)" };
    if (t.includes("scan") || t.includes("imaging")) return { color: "#9D4EDD", bg: "rgba(157,78,221,0.15)", border: "rgba(157,78,221,0.3)" };
    if (t.includes("vaccination")) return { color: "#2a9d8f", bg: "rgba(42,157,143,0.15)", border: "rgba(42,157,143,0.3)" };
    return { color: "#8892A4", bg: "rgba(255,255,255,0.06)", border: "var(--border)" };
  };

  // Filter checkups to ensure only valid Date objects are processed
  const validCheckups = checkups.filter(
    (c) => c.dateVal instanceof Date && !isNaN(c.dateVal.getTime())
  );

  // Format big-calendar events
  const calendarEvents = validCheckups.map((c) => {
    const colors = getTypeColor(c.type);
    return {
      id: c.id,
      title: c.title,
      start: c.dateVal,
      end: c.dateVal,
      allDay: true,
      resource: c,
    };
  });

  const eventStyleGetter = (event) => {
    const colors = getTypeColor(event.resource.type);
    return {
      style: {
        background: colors.bg,
        border: `1px solid ${colors.color}`,
        color: colors.color,
        borderRadius: "6px",
        fontSize: "12px",
        padding: "2px 6px",
        fontWeight: 600,
      },
    };
  };

  const upcomingCheckups = validCheckups.filter((c) => c.status === "upcoming");
  const pastCheckups = validCheckups.filter((c) => c.status !== "upcoming");

  if (profileLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Back Button */}
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

        {/* Header section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {t("calendar.title") || "Checkup Calendar"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Schedule, track, and receive timely AI health checkup reminders.
            </p>
          </div>

          <button
            onClick={() => {
              setForm({
                title: "",
                type: "Doctor Visit",
                date: "",
                time: "",
                doctor: "",
                hospital: "",
                notes: "",
                reminderDays: 1,
              });
              setSelectedCheckup(null);
              setModalOpen(true);
            }}
            className="btn-primary"
            style={{ padding: "10px 18px" }}
          >
            <Plus size={16} />
            {t("calendar.addCheckup") || "Add Checkup"}
          </button>
        </div>

        {/* AI Suggestions Chips */}
        {aiSuggestions.length > 0 && (
          <div style={{ marginBottom: "36px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "14px",
                letterSpacing: "0.5px",
              }}
            >
              <Sparkles size={14} />
              {t("calendar.aiSuggested") || "AI Suggested Preventative Checkups"}
            </h3>

            <div
              style={{
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                paddingBottom: "12px",
                scrollbarWidth: "thin",
              }}
            >
              {aiSuggestions.map((sug, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: "280px",
                    background: "rgba(67, 97, 238, 0.04)",
                    border: "1px solid rgba(67, 97, 238, 0.15)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {sug.title}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1px 6px",
                          borderRadius: "100px",
                          background: sug.urgency === "High" ? "rgba(230,57,70,0.15)" : "rgba(255,255,255,0.06)",
                          color: sug.urgency === "High" ? "var(--accent-red)" : "var(--text-muted)",
                          border: sug.urgency === "High" ? "1px solid rgba(230,57,70,0.3)" : "none",
                        }}
                      >
                        {sug.urgency}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Frequency: {sug.recommendedFrequency}
                    </span>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {sug.reason}
                    </p>
                  </div>

                  <button
                    onClick={() => handleScheduleSuggestion(sug)}
                    className="btn-ghost"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "12px",
                      padding: "6px",
                      borderColor: "rgba(67, 97, 238, 0.2)",
                      background: "rgba(67, 97, 238, 0.08)",
                      color: "#7b9cff",
                    }}
                  >
                    {t("calendar.schedule") || "Schedule Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big Calendar Wrapper */}
        <div
          className="glass-card"
          style={{
            padding: "24px",
            height: "500px",
            marginBottom: "36px",
            border: "1px solid var(--border)",
          }}
        >
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            views={["month"]}
            style={{ height: "100%" }}
            culture={i18n.language === "hi" ? "hi" : i18n.language === "bn" ? "bn" : "en-IN"}
            onSelectEvent={(event) => {
              const data = event.resource;
              setForm({
                title: data.title,
                type: data.type,
                date: new Date(data.dateVal).toISOString().split("T")[0],
                time: data.time || "",
                doctor: data.doctor || "",
                hospital: data.hospital || "",
                notes: data.notes || "",
                reminderDays: data.reminderDays || 1,
              });
              setSelectedCheckup(data);
              setModalOpen(true);
            }}
          />
        </div>

        {/* Upcoming / Past Lists */}
        <div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setActiveTab("upcoming")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "upcoming" ? "2px solid var(--accent-red)" : "none",
                color: activeTab === "upcoming" ? "var(--text-primary)" : "var(--text-muted)",
                padding: "8px 12px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              {t("calendar.upcoming") || "Upcoming"} ({upcomingCheckups.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "past" ? "2px solid var(--accent-red)" : "none",
                color: activeTab === "past" ? "var(--text-primary)" : "var(--text-muted)",
                padding: "8px 12px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              {t("calendar.past") || "Past"} ({pastCheckups.length})
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeTab === "upcoming" ? (
              upcomingCheckups.length > 0 ? (
                upcomingCheckups.map((c) => {
                  const colors = getTypeColor(c.type);
                  return (
                    <div
                      key={c.id}
                      className="glass-card"
                      style={{
                        padding: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "start" }}>
                        <div
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            background: colors.bg,
                            color: colors.color,
                            border: `1px solid ${colors.color}`,
                          }}
                        >
                          <CalendarIcon size={20} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "16px" }}>
                              {c.title}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                background: colors.bg,
                                color: colors.color,
                                padding: "2px 8px",
                                borderRadius: "100px",
                              }}
                            >
                              {c.type}
                            </span>
                          </div>

                          {/* Details */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)" }}>
                              <Clock size={12} />
                              <span>
                                {c.dateVal.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                at {c.time || "Unspecified"}
                              </span>
                            </div>

                            {(c.doctor || c.hospital) && (
                              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px", color: "var(--text-muted)" }}>
                                {c.doctor && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <User size={12} /> {c.doctor}
                                  </span>
                                )}
                                {c.hospital && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <MapPin size={12} /> {c.hospital}
                                  </span>
                                )}
                              </div>
                            )}

                            {c.notes && (
                              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.4 }}>
                                Notes: {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => handleComplete(c)}
                          className="btn-ghost"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            color: "#2EC4B6",
                            borderColor: "rgba(46,196,182,0.2)",
                            background: "rgba(46,196,182,0.06)",
                          }}
                        >
                          <Check size={14} style={{ marginRight: "4px" }} />
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setForm({
                              title: c.title,
                              type: c.type,
                              date: new Date(c.dateVal).toISOString().split("T")[0],
                              time: c.time || "",
                              doctor: c.doctor || "",
                              hospital: c.hospital || "",
                              notes: c.notes || "",
                              reminderDays: c.reminderDays || 1,
                            });
                            setSelectedCheckup(c);
                            setModalOpen(true);
                          }}
                          className="btn-ghost"
                          style={{ padding: "6px 10px" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", padding: "4px" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "16px" }}>
                  {t("calendar.noCheckups") || "No upcoming checkups scheduled."}
                </div>
              )
            ) : pastCheckups.length > 0 ? (
              pastCheckups.map((c) => {
                const colors = getTypeColor(c.type);
                return (
                  <div
                    key={c.id}
                    className="glass-card"
                    style={{
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      opacity: 0.7,
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", alignItems: "start" }}>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.02)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <CalendarIcon size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "16px", textDecoration: "line-through" }}>
                            {c.title}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: "rgba(255,255,255,0.06)",
                              color: "var(--text-muted)",
                              padding: "2px 8px",
                              borderRadius: "100px",
                            }}
                          >
                            {c.type}
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: c.status === "completed" ? "rgba(46,196,182,0.15)" : "rgba(230,57,70,0.1)",
                              color: c.status === "completed" ? "#2EC4B6" : "var(--accent-red)",
                              padding: "2px 8px",
                              borderRadius: "100px",
                            }}
                          >
                            {c.status}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)" }}>
                          <Clock size={12} />
                          <span>
                            {c.dateVal.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            at {c.time || "Unspecified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", padding: "4px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "16px" }}>
                No history recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(6,9,16,0.85)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#0C1222",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "480px",
                padding: "28px",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedCheckup ? "Modify Checkup" : "Schedule Checkup"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Checkup Title *</label>
                  <input
                    className="medikin-input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Cardiologist Visit"
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select
                      className="medikin-input"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {checkupTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Reminder Alert</label>
                    <select
                      className="medikin-input"
                      value={form.reminderDays}
                      onChange={(e) => setForm({ ...form, reminderDays: e.target.value })}
                    >
                      <option value={1}>1 day before</option>
                      <option value={3}>3 days before</option>
                      <option value={7}>1 week before</option>
                      <option value={0}>No reminder</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Date *</label>
                    <input
                      className="medikin-input"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Time</label>
                    <input
                      className="medikin-input"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Doctor (Optional)</label>
                    <input
                      className="medikin-input"
                      value={form.doctor}
                      onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                      placeholder="e.g. Dr. Sen"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Hospital (Optional)</label>
                    <input
                      className="medikin-input"
                      value={form.hospital}
                      onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                      placeholder="e.g. Apollo Hospital"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notes / Special Instructions</label>
                  <textarea
                    className="medikin-input"
                    rows="3"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Fasting required 12 hours prior to test"
                    style={{ resize: "none" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "12px" }}
                >
                  <Check size={16} /> Save Checkup
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "12px",
  color: "var(--text-muted)",
  fontWeight: 600,
};

export default CalendarPage;
