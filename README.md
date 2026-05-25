# MediKin 🏥 — Premium Smart Emergency Health Companion

## Demo link: https://medi-kin.vercel.app/

MediKin is a next-generation, high-performance, dark-themed medical emergency companion app built using **React, Vite, and Firebase**. It is designed to save lives in critical situations by giving emergency responders and doctors immediate, zero-latency access to a patient's core medical data, hand-written prescriptions, and radiological scans via a simple QR code scan, while triggering automated multi-channel SOS dispatches to caregivers.

---

## 🌟 Key Features

### 1. 🚨 Multi-Channel SOS Emergency Dispatch
*   **Single-Bypass hold-to-confirm trigger** (2-second circular SVG holding progress) to prevent accidental alerts.
*   **Parallel Multi-Channel broadcast** alerting emergency contacts via 4 pathways simultaneously:
    1.  **📞 Automated Voice Call:** Places a real-time call using Twilio Voice API reading an emergency notification.
    2.  **💬 WhatsApp Message:** Dispatches a structured, highly formatted alert with an direct maps location link.
    3.  **📱 SMS Alert:** Sends a high-priority SMS containing current browser GPS coordinates.
    4.  **📧 Email Notification:** Fires a custom email via EmailJS with patient parameters and timestamps.
*   **Twilio Diagnostics Support:** Clear inline warnings explain trial limitations (such as number verification, Voice Geo-Permissions, and sandbox keyword joins) for developers testing the prototype.
*   **SOS Trigger History:** Track dispatched alerts, dates, maps links, and channels client-side.

### 2. 📂 Medical Documents & Scans Hub
*   **Canvas-Based Compression Engine:** Uploaded patient scans (X-Rays, MRIs, prescription photos) are dynamically loaded into an HTML5 Canvas, resized, and compressed to a 65% quality JPEG. This reduces images to $\sim$80KB-130KB while preserving flawless text and clinical readability.
*   **PDF Storage Optimization:** Converts blood reports or medical summaries to Base64 strings. Prevents Firestore overflow errors by enforcing a 400KB limit with a user-friendly camera-capture fallback notification.
*   **Firestore Syncing:** Saves all document data arrays cleanly within Firestore profiles at zero external cost on Firebase Spark (Free) plans.

### 3. 📲 Public-Facing Emergency Brief
*   **パラメディック & Doctor Portal:** Scanning the patient's custom QR code instantly opens a highly specialized, responsive dark-themed dashboard.
*   **AI Medical Summaries:** Prompts Groq's `llama-3.3-70b-versatile` model to analyze conditions and medications, highlighting high-risk anticoagulants (e.g. Warfarin), diabetic schedules, or dangerous allergies in bold red alert tags.
*   **Premium Lightbox Scan Viewer:** Clicking any medical report or scan launches a premium, dark-blurred glassmorphic overlay modal allowing doctors to zoom scans, embed PDF readers cleanly, or download documents instantly.

### 4. 🤖 Multilingual AI Health Assistant & Insights
*   **Multilingual Support (i18n):** Flawless in-app toggles for **English, Hindi (Devanagari script), and Bengali**.
*   **Dynamic Language AI Engine:** AI medical briefs, recommended diets, lifestyle adjustments, and active chat assistance translate natively into Devanagari or Bengali script based on the client's current language selection!

### 5. ⌚ Google Fit Wearable Vitals Dashboard
*   **Telemetry Syncing:** Direct OAuth 2.0 credentials handshake to fetch Steps, Heart Rate, and Sleep.
*   **Telemetry Visualizations:** Elegant, highly responsive analytics line charts powered by Recharts (Steps telemetry in Teal, Heart Rate BPM in Red).
*   **AI Wearable Evaluation:** Reviews wearable stats against patient profiles to alert caretakers of potential arrhythmia or abnormal metrics.
*   **Vitals Demo Mode:** Interactive toggle to showcase beautiful, realistic simulated wearable statistics instantly if no Google Fit accounts are linked.

### 6. 📅 AI Scheduled Checkup Calendar
*   **Scheduler Calendar:** Month-based scheduler view powered by `react-big-calendar`.
*   **AI Chip Recommendations:** Analyzes patient history and lists prioritized checkup chips (e.g. "Cardiology checkup in 3 months") which pre-populate the appointment editor instantly when clicked.

---

## 🛠️ Technology Stack

*   **Core Framework:** React 18 (Vite, HMR, React Router DOM v6)
*   **Styling & Motion:** Vanilla CSS, Framer Motion (for smooth micro-animations, lightbox modals, and view transitions)
*   **Charts & Telemetry:** Recharts, lucide-react (icons)
*   **Ecosystem/Calendar:** react-big-calendar, date-fns (locale mapping)
*   **Database:** Firebase Firestore & Firebase Auth
*   **AI Engine:** Groq SDK (Llama 3.3 70B model)
*   **Alert Gateways:** Twilio REST APIs (Basic Auth), EmailJS

---

## ⚙️ Environment Variables (`.env`)

To run the application locally, create a `.env` file in the root directory and add the following keys. **(Note: This file is ignored by Git in `.gitignore` to keep credentials secure):**

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id

# Groq Cloud API Key
VITE_GROQ_API_KEY=your_groq_api_key

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Twilio Credentials (Alerts Broadcast Gateway)
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=your_twilio_sandbox_whatsapp_number  # e.g., +14155238886
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number                # e.g., +13465842824

# Google Fit Integration API credentials
VITE_GOOGLE_FIT_CLIENT_ID=your_google_oauth_client_id
```

---

## 🚀 Installation & Local Running

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/captainramen35-lgtm/MediKin.git
    cd MediKin
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The server will open at `http://localhost:5173`.
4.  **Build production bundle:**
    ```bash
    npm run build
    ```
    Compiles cleanly in under 600ms, outputting optimized static bundles into `/dist`.

---

## 💡 twilio Sandbox Testing Tips

For developers testing this prototype under a **free Twilio Trial Account**:
*   **SMS & Voice Calls:** Standard Twilio trial accounts only deliver SMS or make phone calls to phone numbers that you have explicitly verified under **Verified Caller IDs** in your [Twilio Console](https://console.twilio.com/).
*   **Voice Geo-Permissions:** Trial accounts have international call restrictions by default. Go to *Voice -> Settings -> Geo-Permissions* to enable calls to international recipient codes (e.g. India +91).
*   **WhatsApp sandbox:** The recipient must opt-in to your WhatsApp sandbox first by sending the message containing `join <your-sandbox-keyword>` to your WhatsApp sandbox number (`+1 415 523 8886`).
