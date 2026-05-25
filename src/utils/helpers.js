// Blood group color mapping
export const BLOOD_GROUP_COLORS = {
  "A+": { bg: "rgba(67, 97, 238, 0.2)", color: "#7b9cff", border: "rgba(67, 97, 238, 0.3)" },
  "A-": { bg: "rgba(67, 97, 238, 0.15)", color: "#6b8fff", border: "rgba(67, 97, 238, 0.25)" },
  "B+": { bg: "rgba(244, 162, 97, 0.2)", color: "#F4A261", border: "rgba(244, 162, 97, 0.3)" },
  "B-": { bg: "rgba(244, 162, 97, 0.15)", color: "#e8934e", border: "rgba(244, 162, 97, 0.25)" },
  "O+": { bg: "rgba(46, 196, 182, 0.2)", color: "#2EC4B6", border: "rgba(46, 196, 182, 0.3)" },
  "O-": { bg: "rgba(46, 196, 182, 0.15)", color: "#26b0a4", border: "rgba(46, 196, 182, 0.25)" },
  "AB+": { bg: "rgba(138, 43, 226, 0.2)", color: "#b06cff", border: "rgba(138, 43, 226, 0.3)" },
  "AB-": { bg: "rgba(138, 43, 226, 0.15)", color: "#a05cee", border: "rgba(138, 43, 226, 0.25)" },
};

// Format date
export const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Days since timestamp
export const daysSince = (timestamp) => {
  if (!timestamp) return 0;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
};

// Check if any medication is stale (> 180 days)
export const hasStaleMedication = (medications) => {
  if (!medications || medications.length === 0) return false;
  return medications.some((med) => {
    if (!med.addedAt) return false;
    return daysSince(med.addedAt) > 180;
  });
};

// Format phone number
export const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Common medical conditions for autocomplete
export const COMMON_CONDITIONS = [
  "Diabetes Type 2",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid Disorder",
  "COPD",
  "Epilepsy",
  "Kidney Disease",
  "Cancer",
  "Stroke History",
  "Arthritis",
  "Depression",
  "Anxiety Disorder",
  "Obesity",
  "High Cholesterol",
];

// Common allergies
export const COMMON_ALLERGIES = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Codeine",
  "Latex",
  "Shellfish",
  "Peanuts",
  "Contrast dye",
];

// Medication frequencies
export const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Weekly",
  "Before meals",
  "After meals",
  "At bedtime",
];

// Relation options
export const RELATIONS = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Friend",
  "Caregiver",
  "Guardian",
  "Other",
];

// Generate avatar initials
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Truncate text
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};
