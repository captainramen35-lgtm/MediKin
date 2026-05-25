import emailjs from "@emailjs/browser";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Location Detection
export const getLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
};

// Helper to format phone numbers to standard E.164 (prepending +91 country code for 10-digit Indian numbers)
const formatE164Phone = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, ""); // Keep only digits
  if (digits.length === 10) {
    return `+91${digits}`; // Prepend India country code if exactly 10 digits
  }
  if (digits.length > 10 && !phone.startsWith("+")) {
    return `+${digits}`; // Prepend '+' if country code exists but lacks '+' symbol
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
};

// Helper to make Basic Auth headers for Twilio
const getTwilioHeaders = () => {
  const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const token = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio Account SID or Auth Token is not configured.");
  }
  return {
    Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
};

// CHANNEL 1: Twilio SMS
export const sendSOSSMS = async (contacts, patientName, locationLink) => {
  const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const from = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("Twilio Phone Number is not configured.");

  const promises = contacts.map(async (contact) => {
    const cleanPhone = formatE164Phone(contact.phone);
    const bodyText = `🆘 EMERGENCY SOS — ${patientName} needs immediate help. Their last known location: ${locationLink}. Sent via MediKin.`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: getTwilioHeaders(),
      body: new URLSearchParams({
        To: cleanPhone,
        From: from,
        Body: bodyText,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to send Twilio SMS.");
    }
    return res.json();
  });

  return Promise.all(promises);
};

// CHANNEL 2: Twilio WhatsApp
export const sendSOSWhatsApp = async (contacts, patientName, locationLink) => {
  const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const from = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;
  if (!from) throw new Error("Twilio WhatsApp Sandbox Number is not configured.");

  const promises = contacts.map(async (contact) => {
    const cleanPhone = formatE164Phone(contact.phone);
    const bodyText = `🆘 *EMERGENCY SOS*\n\n*${patientName}* needs immediate help right now.\n\n📍 Last known location:\n${locationLink}\n\n_Sent via MediKin Emergency System_`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: getTwilioHeaders(),
      body: new URLSearchParams({
        To: `whatsapp:${cleanPhone}`,
        From: `whatsapp:${from.replace("whatsapp:", "")}`,
        Body: bodyText,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to send Twilio WhatsApp message.");
    }
    return res.json();
  });

  return Promise.all(promises);
};

// CHANNEL 3: Twilio Voice Call
export const sendSOSCall = async (contacts, patientName) => {
  const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const from = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("Twilio Phone Number is not configured.");

  const promises = contacts.map(async (contact) => {
    const cleanPhone = formatE164Phone(contact.phone);
    const twimlMarkup = `<Response><Say voice="alice" language="en-IN">This is an emergency alert from MediKin. ${patientName} needs immediate medical help. Please respond immediately. This is an automated emergency alert from MediKin. ${patientName} needs immediate medical help. Please respond immediately.</Say></Response>`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: getTwilioHeaders(),
      body: new URLSearchParams({
        To: cleanPhone,
        From: from,
        Twiml: twimlMarkup,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to initiate Twilio Voice Call.");
    }
    return res.json();
  });

  return Promise.all(promises);
};

// CHANNEL 4: EmailJS Email
export const sendSOSEmail = async (contacts, patientName, locationLink) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS credentials are not configured.");
  }

  const emailContacts = contacts.filter((c) => c.email && c.email.trim());
  if (emailContacts.length === 0) {
    return { success: true, message: "No emergency contacts have emails listed." };
  }

  const promises = emailContacts.map((contact) => {
    return emailjs.send(
      serviceId,
      templateId,
      {
        patient_name: patientName,
        contact_name: contact.name,
        location_link: locationLink,
        sent_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      },
      publicKey
    );
  });

  return Promise.all(promises);
};

// Log SOS event in Firestore
export const logSOSEvent = async (profileId, triggeredBy, patientName, contacts, location, locationLink, channels) => {
  await addDoc(collection(db, "sosLogs"), {
    profileId,
    triggeredBy,
    patientName,
    contactsNotified: contacts.map((c) => c.name),
    location: location ? { lat: location.lat, lng: location.lng } : null,
    locationLink,
    channelsUsed: channels,
    status: "sent",
    triggeredAt: serverTimestamp(),
  });

  // Update profile
  await updateDoc(doc(db, "profiles", profileId), {
    lastSOSTriggeredAt: serverTimestamp(),
  });
};
