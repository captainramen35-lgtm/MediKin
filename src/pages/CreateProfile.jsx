import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { createProfile, updateProfile } from "../utils/firestore";
import { useToast } from "../context/ToastContext";
import {
  COMMON_CONDITIONS,
  COMMON_ALLERGIES,
  FREQUENCIES,
  RELATIONS,
  BLOOD_GROUP_COLORS,
  formatPhone,
} from "../utils/helpers";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, User, Stethoscope, Pill, AlertCircle, Phone, FileText } from "lucide-react";

const STEPS = [
  { label: "Patient Info", icon: User },
  { label: "Conditions", icon: Stethoscope },
  { label: "Medications", icon: Pill },
  { label: "Allergies & Surgeries", icon: AlertCircle },
  { label: "Emergency Contacts", icon: Phone },
  { label: "Medical Documents", icon: FileText },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const emptyForm = () => ({
  patient: { name: "", dob: "", gender: "", bloodGroup: "" },
  conditions: [],
  medications: [],
  allergies: [],
  surgeries: [],
  emergencyContacts: [],
  documents: [],
});

const CreateProfile = ({ isEdit = false }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { profile: existingProfile } = useProfile(isEdit ? id : null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    if (isEdit && existingProfile) return existingProfile;
    return emptyForm();
  });

  // Sync form with loaded profile for edit mode
  const [synced, setSynced] = useState(false);
  if (isEdit && existingProfile && !synced) {
    setForm({ ...emptyForm(), ...existingProfile });
    setSynced(true);
  }

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePatient = (key, value) => {
    setForm((prev) => ({
      ...prev,
      patient: { ...prev.patient, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateProfile(id, {
          patient: form.patient,
          conditions: form.conditions,
          medications: form.medications,
          allergies: form.allergies,
          surgeries: form.surgeries,
          emergencyContacts: form.emergencyContacts,
          documents: form.documents || [],
        });
        addToast("Profile updated!", "success");
        navigate(`/profile/${id}/qr`);
      } else {
        const profileId = await createProfile(user.uid, {
          patient: form.patient,
          conditions: form.conditions,
          medications: form.medications,
          allergies: form.allergies,
          surgeries: form.surgeries,
          emergencyContacts: form.emergencyContacts,
          documents: form.documents || [],
        });
        addToast("Profile created!", "success");
        navigate(`/profile/${profileId}/qr`);
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Header */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          {isEdit ? "Edit Profile" : "Create Medical Profile"}
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
          This information will be available to emergency responders when they scan the QR code.
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const S = s.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: done
                        ? "var(--success)"
                        : active
                        ? "var(--accent-red)"
                        : "rgba(255,255,255,0.06)",
                      border: `2px solid ${
                        done
                          ? "var(--success)"
                          : active
                          ? "var(--accent-red)"
                          : "var(--border)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {done ? (
                      <Check size={16} color="white" />
                    ) : (
                      <S size={16} color={active ? "white" : "var(--text-muted)"} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: active
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                      fontWeight: active ? 600 : 400,
                      textAlign: "center",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress track */}
          <div
            style={{
              height: "3px",
              background: "var(--border)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "var(--accent-red)",
                borderRadius: "2px",
              }}
              animate={{
                width: step >= STEPS.length ? "100%" : `${(step / STEPS.length) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 0 && (
              <Step1PatientInfo patient={form.patient} onChange={updatePatient} />
            )}
            {step === 1 && (
              <Step2Conditions
                conditions={form.conditions}
                onChange={(v) => updateForm("conditions", v)}
              />
            )}
            {step === 2 && (
              <Step3Medications
                medications={form.medications}
                onChange={(v) => updateForm("medications", v)}
              />
            )}
            {step === 3 && (
              <Step4AllergiesSurgeries
                allergies={form.allergies}
                surgeries={form.surgeries}
                onAllergyChange={(v) => updateForm("allergies", v)}
                onSurgeryChange={(v) => updateForm("surgeries", v)}
              />
            )}
            {step === 4 && (
              <Step5Contacts
                contacts={form.emergencyContacts}
                onChange={(v) => updateForm("emergencyContacts", v)}
              />
            )}
            {step === 5 && (
              <Step6Documents
                documents={form.documents || []}
                onChange={(v) => updateForm("documents", v)}
              />
            )}
            {step === 6 && <ReviewStep form={form} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "32px",
          }}
        >
          <button
            onClick={goPrev}
            className="btn-ghost"
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < STEPS.length ? (
            <button onClick={goNext} className="btn-primary">
              {step === STEPS.length - 1 ? "Review" : "Continue"}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Confirm & Save"}
              {!saving && <Check size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- STEP 1: Patient Info ----
const Step1PatientInfo = ({ patient, onChange }) => (
  <div className="glass-card" style={{ padding: "28px" }}>
    <h2
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "20px",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "24px",
      }}
    >
      Patient Information
    </h2>

    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input
          className="medikin-input"
          type="text"
          placeholder="e.g. Priya Sharma"
          value={patient.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Date of Birth *</label>
        <input
          className="medikin-input"
          type="date"
          value={patient.dob}
          onChange={(e) => onChange("dob", e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: "flex", gap: "10px" }}>
          {["Male", "Female", "Other"].map((g) => (
            <button
              key={g}
              onClick={() => onChange("gender", g)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: `1px solid ${
                  patient.gender === g ? "var(--accent-blue)" : "var(--border)"
                }`,
                background:
                  patient.gender === g
                    ? "rgba(67, 97, 238, 0.15)"
                    : "rgba(255,255,255,0.04)",
                color:
                  patient.gender === g ? "#7b9cff" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Blood Group *</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
          }}
        >
          {BLOOD_GROUPS.map((bg) => {
            const colors = BLOOD_GROUP_COLORS[bg];
            const selected = patient.bloodGroup === bg;
            return (
              <button
                key={bg}
                onClick={() => onChange("bloodGroup", bg)}
                style={{
                  padding: "14px 8px",
                  borderRadius: "12px",
                  border: `2px solid ${selected ? colors.border : "var(--border)"}`,
                  background: selected ? colors.bg : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "20px" }}>🩸</span>
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: selected ? colors.color : "var(--text-muted)",
                  }}
                >
                  {bg}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

// ---- STEP 2: Conditions ----
const Step2Conditions = ({ conditions, onChange }) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = COMMON_CONDITIONS.filter(
    (c) =>
      c.toLowerCase().includes(input.toLowerCase()) &&
      !conditions.includes(c)
  );

  const add = (val) => {
    const v = val.trim();
    if (v && !conditions.includes(v)) {
      onChange([...conditions, v]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (c) => onChange(conditions.filter((x) => x !== c));

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
        Medical Conditions
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        Type a condition and press Enter, or select from suggestions.
      </p>

      <div style={{ position: "relative", marginBottom: "16px" }}>
        <input
          className="medikin-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type a condition..."
        />
        {showSuggestions && filtered.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              background: "#0F1525",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {filtered.slice(0, 6).map((c) => (
              <button
                key={c}
                onMouseDown={() => add(c)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.target.style.background = "none")}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {conditions.map((c) => (
          <motion.span
            key={c}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="pill pill-blue"
            style={{ cursor: "pointer" }}
            onClick={() => remove(c)}
          >
            {c}
            <X size={12} />
          </motion.span>
        ))}
      </div>
      {conditions.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px" }}>
          No conditions added yet. Leave blank if none.
        </p>
      )}
    </div>
  );
};

// Small X for pills
const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---- STEP 3: Medications ----
const Step3Medications = ({ medications, onChange }) => {
  const [form, setForm] = useState({ name: "", dose: "", frequency: "Once daily" });
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!form.name.trim()) return;
    onChange([
      ...medications,
      { ...form, addedAt: new Date().toISOString() },
    ]);
    setForm({ name: "", dose: "", frequency: "Once daily" });
    setAdding(false);
  };

  const remove = (i) => onChange(medications.filter((_, idx) => idx !== i));

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
        Current Medications
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        List all medications the patient is currently taking.
      </p>

      {medications.map((med, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
              {med.name}
              {med.dose && (
                <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: "8px" }}>
                  {med.dose}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{med.frequency}</div>
          </div>
          <button
            onClick={() => remove(i)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", padding: "4px" }}
          >
            <Trash2 size={16} />
          </button>
        </motion.div>
      ))}

      {adding ? (
        <div
          style={{
            padding: "16px",
            background: "rgba(67, 97, 238, 0.06)",
            border: "1px solid rgba(67, 97, 238, 0.2)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            className="medikin-input"
            placeholder="Medication name (e.g. Metformin)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input
              className="medikin-input"
              placeholder="Dose (e.g. 500mg)"
              value={form.dose}
              onChange={(e) => setForm({ ...form, dose: e.target.value })}
            />
            <select
              className="medikin-input"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={add} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              <Check size={16} /> Add
            </button>
            <button onClick={() => setAdding(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Plus size={16} />
          Add Medication
        </button>
      )}
    </div>
  );
};

// ---- STEP 4: Allergies & Surgeries ----
const Step4AllergiesSurgeries = ({ allergies, surgeries, onAllergyChange, onSurgeryChange }) => {
  const [allergyInput, setAllergyInput] = useState("");
  const [surgeryName, setSurgeryName] = useState("");
  const [surgeryYear, setSurgeryYear] = useState("");

  const addAllergy = () => {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) {
      onAllergyChange([...allergies, v]);
    }
    setAllergyInput("");
  };

  const addSurgery = () => {
    if (!surgeryName.trim()) return;
    onSurgeryChange([...surgeries, { name: surgeryName.trim(), year: surgeryYear }]);
    setSurgeryName("");
    setSurgeryYear("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Allergies */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
          Known Allergies
        </h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <input
            className="medikin-input"
            placeholder="e.g. Penicillin, Aspirin"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addAllergy();
              }
            }}
          />
          <button onClick={addAllergy} className="btn-primary" style={{ flexShrink: 0, padding: "12px 16px" }}>
            <Plus size={16} />
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {COMMON_ALLERGIES.filter((a) => !allergies.includes(a)).map((a) => (
            <button
              key={a}
              onClick={() => onAllergyChange([...allergies, a])}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                padding: "4px 10px",
                fontSize: "12px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              + {a}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {allergies.map((a) => (
            <span
              key={a}
              className="pill pill-red"
              style={{ cursor: "pointer" }}
              onClick={() => onAllergyChange(allergies.filter((x) => x !== a))}
            >
              {a} <X size={12} />
            </span>
          ))}
        </div>
      </div>

      {/* Surgeries */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
          Past Surgeries
        </h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <input
            className="medikin-input"
            placeholder="Surgery name (e.g. Appendectomy)"
            value={surgeryName}
            onChange={(e) => setSurgeryName(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            className="medikin-input"
            placeholder="Year"
            value={surgeryYear}
            onChange={(e) => setSurgeryYear(e.target.value)}
            style={{ flex: 1 }}
            maxLength={4}
          />
          <button onClick={addSurgery} className="btn-primary" style={{ flexShrink: 0, padding: "12px 16px" }}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {surgeries.map((s, i) => (
            <span
              key={i}
              className="pill pill-green"
              style={{ cursor: "pointer" }}
              onClick={() => onSurgeryChange(surgeries.filter((_, idx) => idx !== i))}
            >
              {s.name}{s.year ? ` (${s.year})` : ""} <X size={12} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- STEP 5: Emergency Contacts ----
const Step5Contacts = ({ contacts, onChange }) => {
  const [form, setForm] = useState({ name: "", relation: "Spouse", phone: "", email: "" });

  const add = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (contacts.length >= 3) return;
    onChange([...contacts, { ...form }]);
    setForm({ name: "", relation: "Spouse", phone: "", email: "" });
  };

  const remove = (i) => onChange(contacts.filter((_, idx) => idx !== i));

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
        Emergency Contacts
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        Up to 3 contacts. These will be shown to doctors with a call button and notified during SOS.
      </p>

      {contacts.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {c.relation} · {c.phone} {c.email && `· ${c.email}`}
            </div>
          </div>
          <button
            onClick={() => remove(i)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", padding: "4px" }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {contacts.length < 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input
              className="medikin-input"
              placeholder="Contact name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              className="medikin-input"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
            >
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input
              className="medikin-input"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
            />
            <input
              className="medikin-input"
              placeholder="Email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <button onClick={add} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      )}
    </div>
  );
};

// ---- REVIEW STEP ----
const ReviewStep = ({ form }) => (
  <div className="glass-card" style={{ padding: "28px" }}>
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
      Review & Confirm
    </h2>

    <Section title="Patient">
      <Row label="Name" value={form.patient?.name} />
      <Row label="Date of Birth" value={form.patient?.dob} />
      <Row label="Gender" value={form.patient?.gender} />
      <Row label="Blood Group" value={form.patient?.bloodGroup && <BloodGroupBadge bloodGroup={form.patient.bloodGroup} size="sm" />} />
    </Section>

    <Section title="Conditions">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {form.conditions?.length > 0 ? form.conditions.map((c) => (
          <span key={c} className="pill pill-blue">{c}</span>
        )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
      </div>
    </Section>

    <Section title="Medications">
      {form.medications?.length > 0 ? form.medications.map((m, i) => (
        <div key={i} style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
          {m.name} {m.dose && `(${m.dose})`} — <span style={{ color: "var(--text-muted)" }}>{m.frequency}</span>
        </div>
      )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
    </Section>

    <Section title="Allergies">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {form.allergies?.length > 0 ? form.allergies.map((a) => (
          <span key={a} className="pill pill-red">{a}</span>
        )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
      </div>
    </Section>

    <Section title="Surgeries">
      {form.surgeries?.length > 0 ? form.surgeries.map((s, i) => (
        <div key={i} style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
          {s.name} {s.year && `(${s.year})`}
        </div>
      )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
    </Section>

    <Section title="Emergency Contacts">
      {form.emergencyContacts?.length > 0 ? form.emergencyContacts.map((c, i) => (
        <div key={i} style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
          {c.name} ({c.relation}) — {c.phone} {c.email && `(${c.email})`}
        </div>
      )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
    </Section>

    <Section title="Medical Documents & Scans" last>
      {form.documents?.length > 0 ? form.documents.map((d, i) => (
        <div key={i} style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
          {d.title} — <span style={{ color: "var(--text-muted)" }}>{d.type} ({d.date})</span>
        </div>
      )) : <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>None</span>}
    </Section>
  </div>
);

const Section = ({ title, children, last }) => (
  <div style={{ marginBottom: last ? 0 : "24px", paddingBottom: last ? 0 : "24px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
      {title}
    </h3>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", gap: "12px", marginBottom: "8px", alignItems: "center" }}>
    <span style={{ fontSize: "13px", color: "var(--text-muted)", minWidth: "100px" }}>{label}</span>
    <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>{value || "—"}</span>
  </div>
);

// ---- STEP 6: Medical Documents & Scans ----
const Step6Documents = ({ documents, onChange }) => {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Prescription");
  const [docDate, setDocDate] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [compressing, setCompressing] = useState(false);

  const add = () => {
    if (!title.trim() || !uploadFile) return;
    const newDoc = {
      id: Date.now().toString(),
      title: title.trim(),
      type: docType,
      date: docDate || new Date().toISOString().split("T")[0],
      fileData: uploadFile.dataUrl,
      fileName: uploadFile.name,
      fileType: uploadFile.type,
    };
    onChange([...documents, newDoc]);
    setTitle("");
    setDocType("Prescription");
    setDocDate("");
    setUploadFile(null);
  };

  const remove = (id) => onChange(documents.filter((doc) => doc.id !== id));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressing(true);
    try {
      if (file.type === "application/pdf") {
        if (file.size > 400 * 1024) {
          alert("PDF reports must be under 400KB to fit. Please capture a photo of the document, or use a smaller PDF.");
          setCompressing(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadFile({
            dataUrl: event.target.result,
            name: file.name,
            type: "application/pdf",
          });
          setCompressing(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
            setUploadFile({
              dataUrl,
              name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              type: "image/jpeg",
            });
            setCompressing(false);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        return;
      }

      alert("Please upload standard formats: images (PNG, JPG, WebP) or PDF reports.");
    } catch (err) {
      console.error(err);
      alert("Error processing file. Please try a different document.");
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
        Medical Documents & Scans
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        Upload previous prescriptions, blood tests, or radiology scans so emergency responders can access them immediately.
      </p>

      {/* Uploaded List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {documents.map((d) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{d.title}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                <span style={{
                  background: d.type === "Scan" ? "rgba(244,162,97,0.15)" : d.type === "Blood Test" ? "rgba(67,97,238,0.15)" : "rgba(255,255,255,0.06)",
                  color: d.type === "Scan" ? "#F4A261" : d.type === "Blood Test" ? "#4361EE" : "var(--text-muted)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  marginRight: "8px",
                  fontWeight: 600
                }}>
                  {d.type}
                </span>
                {d.date} · {d.fileName}
              </div>
            </div>
            <button
              onClick={() => remove(d.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-red)", padding: "4px" }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Document Form */}
      <div
        style={{
          padding: "16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelStyle}>Document Title *</label>
            <input
              className="medikin-input"
              placeholder="e.g., Chest X-Ray, Blood Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Document Type</label>
            <select
              className="medikin-input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="Prescription">Prescription</option>
              <option value="Blood Test">Blood Test</option>
              <option value="Scan">Radiology Scan (X-Ray/MRI)</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelStyle}>Document Date</label>
            <input
              className="medikin-input"
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>File Upload (.jpg, .png, .pdf) *</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%"
                }}
              />
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed var(--border)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {compressing ? (
                  <span>Compressing...</span>
                ) : uploadFile ? (
                  <span style={{ color: "#2EC4B6", fontWeight: 600 }}>✓ {uploadFile.name}</span>
                ) : (
                  <span>Choose or drop file</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={add}
          className="btn-primary"
          disabled={!title.trim() || !uploadFile || compressing}
          style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
        >
          <Plus size={16} /> Add Medical Document
        </button>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  color: "var(--text-muted)",
  fontWeight: 500,
};

export default CreateProfile;
