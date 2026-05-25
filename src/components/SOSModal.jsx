import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, PhoneCall, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserProfiles } from "../utils/firestore";
import {
  getLocation,
  sendSOSSMS,
  sendSOSWhatsApp,
  sendSOSCall,
  sendSOSEmail,
  logSOSEvent,
} from "../utils/sos";
import { useToast } from "../context/ToastContext";

const SOSModal = ({ isOpen, onClose, preselectedProfileId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1); // 1: Select Profile, 2: Confirm, 3: Sending, 4: Success
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Hold to confirm states
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef(null);
  const holdStartTimeRef = useRef(0);

  // Channel progress states
  const [channelStatus, setChannelStatus] = useState({
    call: "idle", // idle, sending, success, error
    whatsapp: "idle",
    sms: "idle",
    email: "idle",
  });

  // Load profiles on mount/open
  useEffect(() => {
    if (!isOpen) return;

    // Reset states
    setStep(1);
    setHoldProgress(0);
    setChannelStatus({
      call: "idle",
      whatsapp: "idle",
      sms: "idle",
      email: "idle",
    });

    if (preselectedProfileId) {
      // Direct confirm if triggered for specific profile
      const fetchPreselected = async () => {
        setLoadingProfiles(true);
        try {
          const list = await getUserProfiles(user.uid);
          setProfiles(list);
          const found = list.find((p) => p.id === preselectedProfileId);
          if (found) {
            setSelectedProfile(found);
            setStep(2);
          } else {
            setStep(1);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingProfiles(false);
        }
      };
      fetchPreselected();
    } else {
      // Normal list
      const fetchList = async () => {
        setLoadingProfiles(true);
        try {
          const list = await getUserProfiles(user.uid);
          setProfiles(list);
          if (list.length === 1) {
            setSelectedProfile(list[0]);
            setStep(2);
          } else {
            setStep(1);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingProfiles(false);
        }
      };
      fetchList();
    }
  }, [isOpen, preselectedProfileId, user?.uid]);

  // Hold-to-confirm handlers
  const startHold = () => {
    holdStartTimeRef.current = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoldProgress(progress);

      if (elapsed >= 2000) {
        clearInterval(holdIntervalRef.current);
        triggerSOSAlerts();
      }
    }, 40);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  // Trigger SOS alert logic
  const triggerSOSAlerts = async () => {
    setStep(3);
    setChannelStatus({
      call: "sending",
      whatsapp: "sending",
      sms: "sending",
      email: "sending",
    });

    // 1. Get GPS Location
    let loc = null;
    try {
      loc = await getLocation();
    } catch {
      addToast(t("sos.locationUnavailable") || "Location unavailable — sending alerts without location.", "warning");
    }

    const locationLink = loc
      ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
      : "Location unavailable — please track their phone.";

    const contacts = selectedProfile.emergencyContacts || [];
    const patientName = selectedProfile.patient?.name || "Patient";

    let smsSuccess = false;
    let whatsappSuccess = false;
    let callSuccess = false;
    let emailSuccess = false;

    // 2. Fire alert requests in parallel
    const smsPromise = sendSOSSMS(contacts, patientName, locationLink)
      .then(() => {
        setChannelStatus((prev) => ({ ...prev, sms: "success" }));
        smsSuccess = true;
      })
      .catch((e) => {
        console.error("SMS error:", e);
        setChannelStatus((prev) => ({ ...prev, sms: "error" }));
      });

    const whatsappPromise = sendSOSWhatsApp(contacts, patientName, locationLink)
      .then(() => {
        setChannelStatus((prev) => ({ ...prev, whatsapp: "success" }));
        whatsappSuccess = true;
      })
      .catch((e) => {
        console.error("WhatsApp error:", e);
        setChannelStatus((prev) => ({ ...prev, whatsapp: "error" }));
      });

    const callPromise = sendSOSCall(contacts, patientName)
      .then(() => {
        setChannelStatus((prev) => ({ ...prev, call: "success" }));
        callSuccess = true;
      })
      .catch((e) => {
        console.error("Voice call error:", e);
        setChannelStatus((prev) => ({ ...prev, call: "error" }));
      });

    const emailPromise = sendSOSEmail(contacts, patientName, locationLink)
      .then(() => {
        setChannelStatus((prev) => ({ ...prev, email: "success" }));
        emailSuccess = true;
      })
      .catch((e) => {
        console.error("Email error:", e);
        setChannelStatus((prev) => ({ ...prev, email: "error" }));
      });

    // Wait for all channels to resolve
    await Promise.all([smsPromise, whatsappPromise, callPromise, emailPromise]);

    const successCount = (smsSuccess ? 1 : 0) + (whatsappSuccess ? 1 : 0) + (callSuccess ? 1 : 0) + (emailSuccess ? 1 : 0);
    const emailContactsCount = contacts.filter((c) => c.email && c.email.trim()).length;
    const targetChannelsCount = 3 + (emailContactsCount > 0 ? 1 : 0);

    // 3. Write Firestore log
    const channelsUsed = [];
    if (smsSuccess) channelsUsed.push("sms");
    if (whatsappSuccess) channelsUsed.push("whatsapp");
    if (callSuccess) channelsUsed.push("call");
    if (emailSuccess) channelsUsed.push("email");

    if (channelsUsed.length > 0) {
      try {
        await logSOSEvent(
          selectedProfile.id,
          user.uid,
          patientName,
          contacts,
          loc,
          locationLink,
          channelsUsed
        );
      } catch (e) {
        console.error("Error logging SOS event:", e);
      }
    }

    if (successCount === 0) {
      // Step 5: All channels failed
      setStep(5);
    } else if (successCount < targetChannelsCount) {
      // Step 4: Partial success (keep open so they can see which failed)
      setStep(4);
    } else {
      // Step 4: Full success, auto-close
      setStep(4);
      setTimeout(() => {
        onClose();
      }, 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 9, 16, 0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          background: "#0C1222",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "460px",
          padding: "32px 24px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        {/* Close Button */}
        {step < 3 && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Profile Selector */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                Who is this SOS for?
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                Select the family member needing emergency assistance.
              </p>

              {loadingProfiles ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <Loader2 size={32} className="animate-spin" color="var(--accent-red)" />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProfile(p);
                        setStep(2);
                      }}
                      style={{
                        padding: "16px 20px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-red)";
                        e.currentTarget.style.background = "rgba(230,57,70,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: "15px",
                            marginBottom: "4px",
                          }}
                        >
                          {p.patient?.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Blood: {p.patient?.bloodGroup} · {p.patient?.gender}
                        </div>
                      </div>
                      <span style={{ fontSize: "18px" }}>🩸</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Hold to Confirm */}
          {step === 2 && selectedProfile && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(230, 57, 70, 0.1)",
                  border: "1px solid rgba(230, 57, 70, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-red)",
                  marginBottom: "16px",
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {t("sos.confirmTitle") || "Send Emergency SOS?"}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                This will immediately alert all emergency contacts for{" "}
                <strong style={{ color: "var(--text-primary)" }}>{selectedProfile.patient?.name}</strong>.
              </p>

              {/* Contacts to be notified list */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "14px",
                  padding: "16px",
                  textAlign: "left",
                  marginBottom: "28px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "10px",
                    letterSpacing: "0.5px",
                  }}
                >
                  Contacts to alert:
                </div>
                {selectedProfile.emergencyContacts?.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span>
                      {c.name} ({c.relation})
                    </span>
                    <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {c.phone}
                    </span>
                  </div>
                ))}
                {(!selectedProfile.emergencyContacts ||
                  selectedProfile.emergencyContacts.length === 0) && (
                  <p style={{ color: "var(--accent-red)", fontSize: "13px", margin: 0 }}>
                    ⚠️ No emergency contacts recorded.
                  </p>
                )}
              </div>

              {/* Hold-to-Confirm Button */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ position: "relative", width: "120px", height: "120px" }}>
                  {/* Circular progress background */}
                  <svg style={{ transform: "rotate(-90deg)", width: "120px", height: "120px" }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="var(--accent-red)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="314"
                      strokeDashoffset={314 - (314 * holdProgress) / 100}
                      style={{ transition: "stroke-dashoffset 0.05s linear" }}
                    />
                  </svg>

                  {/* Hold target */}
                  <button
                    onMouseDown={selectedProfile.emergencyContacts?.length > 0 ? startHold : undefined}
                    onMouseUp={selectedProfile.emergencyContacts?.length > 0 ? stopHold : undefined}
                    onMouseLeave={selectedProfile.emergencyContacts?.length > 0 ? stopHold : undefined}
                    onTouchStart={selectedProfile.emergencyContacts?.length > 0 ? startHold : undefined}
                    onTouchEnd={selectedProfile.emergencyContacts?.length > 0 ? stopHold : undefined}
                    disabled={!selectedProfile.emergencyContacts || selectedProfile.emergencyContacts.length === 0}
                    style={{
                      position: "absolute",
                      inset: "15px",
                      borderRadius: "50%",
                      background: selectedProfile.emergencyContacts?.length > 0 ? "var(--accent-red)" : "#4A5568",
                      border: "none",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: selectedProfile.emergencyContacts?.length > 0 ? "pointer" : "not-allowed",
                      boxShadow: selectedProfile.emergencyContacts?.length > 0 ? "0 10px 25px rgba(230,57,70,0.4)" : "none",
                      userSelect: "none",
                    }}
                  >
                    <PhoneCall size={32} />
                  </button>
                </div>

                <span style={{ fontSize: "13px", color: selectedProfile.emergencyContacts?.length > 0 ? "var(--text-muted)" : "var(--accent-red)", fontWeight: 500 }}>
                  {!selectedProfile.emergencyContacts || selectedProfile.emergencyContacts.length === 0
                    ? "Add emergency contacts to enable SOS"
                    : holdProgress > 0
                    ? "Keep holding..."
                    : t("sos.holdToConfirm") || "HOLD FOR 2S TO ACTIVATE"}
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Multi-channel Parallel Sending */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                {t("sos.sending") || "Sending Emergency Alerts..."}
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  textAlign: "center",
                  marginBottom: "28px",
                }}
              >
                Contacting all emergency services and family members in parallel.
              </p>

              {/* Status Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { key: "call", label: "📞 Automated Call", color: "#F4A261" },
                  { key: "whatsapp", label: "💬 WhatsApp Message", color: "#2EC4B6" },
                  { key: "sms", label: "📱 SMS Alert", color: "#4361EE" },
                  { key: "email", label: "📧 Email Notification", color: "#9D4EDD" },
                ].map((channel) => {
                  const status = channelStatus[channel.key];
                  return (
                    <div
                      key={channel.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {channel.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {status === "sending" && (
                          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            <Loader2
                              size={16}
                              className="animate-spin"
                              style={{ display: "inline", marginRight: "6px" }}
                            />
                            Sending…
                          </span>
                        )}
                        {status === "success" && (
                          <span style={{ fontSize: "13px", color: "#2EC4B6", fontWeight: 600 }}>
                            <Check size={16} style={{ display: "inline", marginRight: "4px" }} />
                            Alerted
                          </span>
                        )}
                        {status === "error" && (
                          <span style={{ fontSize: "13px", color: "var(--accent-red)", fontWeight: 600 }}>
                            <X size={16} style={{ display: "inline", marginRight: "4px" }} />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success state */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              {Object.values(channelStatus).includes("error") ? (
                <>
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "rgba(244, 162, 97, 0.1)",
                      border: "2px solid #F4A261",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#F4A261",
                      marginBottom: "24px",
                      boxShadow: "0 0 30px rgba(244, 162, 97, 0.3)",
                    }}
                  >
                    <AlertTriangle size={36} />
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: "12px",
                    }}
                  >
                    Partial Alerts Sent
                  </h3>
                  <p
                    style={{
                      color: "#ffd5b3",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      maxWidth: "320px",
                      margin: "0 auto 16px",
                    }}
                  >
                    Some channels failed to deliver, but other alerts were successfully sent to your contacts!
                  </p>

                  <div
                    style={{
                      background: "rgba(244, 162, 97, 0.06)",
                      border: "1px solid rgba(244, 162, 97, 0.2)",
                      borderRadius: "14px",
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "13px",
                      color: "#ffd5b3",
                      lineHeight: "1.6",
                      marginBottom: "24px",
                    }}
                  >
                    <strong style={{ color: "#F4A261", display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      ⚠️ Twilio Trial Account Restrictions
                    </strong>
                    For free Twilio accounts, destination numbers must satisfy these trial requirements to receive alerts:
                    <ul style={{ paddingLeft: "16px", margin: "6px 0 0 0", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <li>
                        <strong>SMS & Calls:</strong> Recipient numbers must be added to <em>Verified Caller IDs</em> in your Twilio Developer Console.
                      </li>
                      <li>
                        <strong>WhatsApp:</strong> Recipient must send <strong>"join &lt;your-sandbox-keyword&gt;"</strong> to the Twilio WhatsApp sandbox number (e.g. <code>+1 415 523 8886</code>).
                      </li>
                      <li>
                        <strong>Geo-Permissions:</strong> Standard SMS and Voice call permissions for the recipient's country (e.g., India) must be enabled in your Twilio settings.
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={onClose}
                    className="btn-ghost"
                    style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "rgba(46, 196, 182, 0.1)",
                      border: "2px solid #2EC4B6",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2EC4B6",
                      marginBottom: "24px",
                      boxShadow: "0 0 30px rgba(46, 196, 182, 0.3)",
                    }}
                  >
                    <Check size={36} />
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: "12px",
                    }}
                  >
                    Alerts Sent!
                  </h3>
                  <p
                    style={{
                      color: "#d0d8ee",
                      fontSize: "15px",
                      lineHeight: 1.6,
                      maxWidth: "320px",
                      margin: "0 auto",
                    }}
                  >
                    {t("sos.success") || "Emergency contacts have been notified. Help is on the way."}
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* STEP 5: Total Failure */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(230, 57, 70, 0.1)",
                  border: "2px solid var(--accent-red)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-red)",
                  marginBottom: "24px",
                  boxShadow: "0 0 30px rgba(230, 57, 70, 0.3)",
                }}
              >
                <AlertTriangle size={36} />
              </div>

              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                }}
              >
                SOS Alerts Failed!
              </h3>
              <p
                style={{
                  color: "#ffb3b9",
                  fontSize: "14.5px",
                  lineHeight: 1.6,
                  maxWidth: "340px",
                  margin: "0 auto 28px",
                }}
              >
                All alert channels failed to deliver. Please check your Twilio/EmailJS setup, or ensure your phone number is verified on your trial account.
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={triggerSOSAlerts}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center", padding: "12px" }}
                >
                  <RefreshCw size={14} style={{ marginRight: "6px" }} />
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center", padding: "12px" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SOSModal;
