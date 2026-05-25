import i18n from "../i18n";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getLangInstruction = (lang) => {
  if (lang === "hi") return "\n\nRespond entirely in Hindi (Devanagari script).";
  if (lang === "bn") return "\n\nRespond entirely in Bengali (Bengali script).";
  return "";
};

export const callGroq = async (messages, systemPrompt) => {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Groq API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateEmergencyBrief = async (profile) => {
  const systemPrompt = `You are an emergency medical AI. Generate a concise clinical emergency brief for a doctor or nurse who just scanned a patient's QR code. The patient cannot speak for themselves.

Instructions:
- Write one paragraph (3-5 sentences) summarizing the patient's medical situation in clinical language
- Prioritize life-critical information first (allergies to common drugs, blood thinners, insulin, etc.)
- Flag anything dangerous in ALL CAPS inline
- After the paragraph, output a JSON array called "criticalAlerts" containing strings for each critical warning (e.g. "Patient is on Warfarin — HIGH BLEEDING RISK", "ALLERGY: Penicillin — DO NOT ADMINISTER")
- Keep total output under 200 words
- Respond in this exact format:
  BRIEF: [paragraph here]
  ALERTS: ["alert1", "alert2"]${getLangInstruction(i18n.language)}`;

  const userMessage = `Patient data: ${JSON.stringify(profile, null, 2)}`;

  const result = await callGroq(
    [{ role: "user", content: userMessage }],
    systemPrompt
  );

  // Parse the response
  const briefMatch = result.match(/BRIEF:\s*([\s\S]*?)(?=ALERTS:|$)/);
  const alertsMatch = result.match(/ALERTS:\s*(\[[\s\S]*\])/);

  const brief = briefMatch ? briefMatch[1].trim() : result;
  let criticalAlerts = [];

  if (alertsMatch) {
    try {
      criticalAlerts = JSON.parse(alertsMatch[1]);
    } catch {
      // fallback: extract from text
      criticalAlerts = [];
    }
  }

  return { brief, criticalAlerts };
};

export const generateChatResponse = async (profile, messages) => {
  const systemPrompt = `You are a helpful medical assistant for a family managing a loved one's health profile. 
The patient's profile: ${JSON.stringify(profile)}
Answer questions about their conditions, medications, what symptoms to watch for, and when to seek emergency care. 
Never replace professional medical advice. Always recommend consulting a doctor for serious concerns. Keep answers clear and non-technical unless asked otherwise.${getLangInstruction(i18n.language)}`;

  return await callGroq(messages, systemPrompt);
};

export const generateAIRecommendations = async (profile, lang) => {
  const age = profile.patient?.dob
    ? new Date().getFullYear() - new Date(profile.patient.dob).getFullYear()
    : "Unknown age";

  const systemPrompt = `You are a clinical AI health advisor. Generate personalized, specific health recommendations for this patient based on their exact medical profile. 

Patient Profile:
Name: ${profile.patient?.name || "Patient"}
Age: ${age}
Gender: ${profile.patient?.gender || "Unknown"}
Blood Group: ${profile.patient?.bloodGroup || "Unknown"}
Conditions: ${JSON.stringify(profile.conditions || [])}
Current Medications: ${JSON.stringify(profile.medications || [])}
Allergies: ${JSON.stringify(profile.allergies || [])}
Past Surgeries: ${JSON.stringify(profile.surgeries || [])}

Generate exactly 6 recommendations. Each must be specific to THIS patient's data, not generic advice.

Respond ONLY in this JSON format, no preamble, no markdown:
[
  {
    "category": "Medication | Diet | Lifestyle | Warning | Checkup",
    "priority": "High | Medium | Low",
    "title": "short title",
    "body": "2-4 sentence specific recommendation"
  }
]${getLangInstruction(lang)}`;

  const result = await callGroq([{ role: "user", content: "Generate now." }], systemPrompt);
  
  // Clean JSON response from markdown blocks if any
  let cleanResult = result.trim();
  if (cleanResult.startsWith("```json")) {
    cleanResult = cleanResult.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanResult.startsWith("```")) {
    cleanResult = cleanResult.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleanResult);
  } catch (err) {
    // Retry once with a clean request if JSON parsing failed
    console.warn("Retrying recommendations due to parse error:", err);
    const retryResult = await callGroq(
      [{ role: "user", content: "Return ONLY the raw JSON array, with no other text." }],
      systemPrompt
    );
    let cleanRetry = retryResult.trim();
    if (cleanRetry.startsWith("```json")) {
      cleanRetry = cleanRetry.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanRetry.startsWith("```")) {
      cleanRetry = cleanRetry.replace(/^```/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleanRetry);
  }
};

export const generateAICheckups = async (profile, lang) => {
  const systemPrompt = `You are a clinical AI health advisor. Suggest routine or preventative medical checkups this patient should schedule based on their medical profile. 

Patient Profile:
Conditions: ${JSON.stringify(profile.conditions || [])}
Current Medications: ${JSON.stringify(profile.medications || [])}
Allergies: ${JSON.stringify(profile.allergies || [])}

Respond ONLY in this JSON format, no preamble, no markdown:
[
  {
    "title": "checkup title (e.g. HbA1c Blood Test)",
    "type": "Blood Test | Doctor Visit | Medication Refill | Scan/Imaging | Vaccination | Other",
    "recommendedFrequency": "e.g. Every 3 months",
    "urgency": "High | Medium | Low",
    "reason": "short clinical reason why this is recommended"
  }
]${getLangInstruction(lang)}`;

  const result = await callGroq([{ role: "user", content: "Suggest checkups." }], systemPrompt);
  
  let cleanResult = result.trim();
  if (cleanResult.startsWith("```json")) {
    cleanResult = cleanResult.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanResult.startsWith("```")) {
    cleanResult = cleanResult.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleanResult);
  } catch (err) {
    console.warn("Retrying checkups due to parse error:", err);
    const retryResult = await callGroq(
      [{ role: "user", content: "Return ONLY the raw JSON array, with no other text." }],
      systemPrompt
    );
    let cleanRetry = retryResult.trim();
    if (cleanRetry.startsWith("```json")) {
      cleanRetry = cleanRetry.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanRetry.startsWith("```")) {
      cleanRetry = cleanRetry.replace(/^```/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleanRetry);
  }
};

export const generateAIVitalsAnalysis = async (profile, vitals, lang) => {
  const systemPrompt = `You are a clinical AI health advisor. Today's patient vitals:
Steps: ${vitals.steps} steps
Heart Rate: ${vitals.heartRate} BPM
Sleep: ${vitals.sleep} hours

Patient medical conditions: ${JSON.stringify(profile.conditions || [])}
Patient current medications: ${JSON.stringify(profile.medications || [])}

Analyze these vitals in the context of their specific medical conditions. Provide 2-3 short, actionable clinical insights.

Respond ONLY in this JSON format, no preamble, no markdown:
[
  {
    "insight": "short clinical insight sentence",
    "severity": "Normal | Watch | Alert"
  }
]${getLangInstruction(lang)}`;

  const result = await callGroq([{ role: "user", content: "Analyze vitals." }], systemPrompt);
  
  let cleanResult = result.trim();
  if (cleanResult.startsWith("```json")) {
    cleanResult = cleanResult.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanResult.startsWith("```")) {
    cleanResult = cleanResult.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleanResult);
  } catch (err) {
    console.warn("Retrying vitals analysis due to parse error:", err);
    const retryResult = await callGroq(
      [{ role: "user", content: "Return ONLY the raw JSON array, with no other text." }],
      systemPrompt
    );
    let cleanRetry = retryResult.trim();
    if (cleanRetry.startsWith("```json")) {
      cleanRetry = cleanRetry.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanRetry.startsWith("```")) {
      cleanRetry = cleanRetry.replace(/^```/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleanRetry);
  }
};
