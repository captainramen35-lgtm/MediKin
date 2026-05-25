import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = async (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("medikin_lang", code);
    setIsOpen(false);

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          preferredLanguage: code,
        });
      } catch (e) {
        console.error("Error updating language in Firestore:", e);
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          fontSize: "13px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        <Globe size={15} />
        <span>{currentLang.flag} {currentLang.name}</span>
        <ChevronDown size={12} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop click to close */}
          <div onClick={() => setIsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
          
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "6px",
              background: "#0F1525",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              zIndex: 101,
              overflow: "hidden",
              minWidth: "120px",
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px 14px",
                  background: i18n.language === lang.code ? "rgba(255,255,255,0.06)" : "none",
                  border: "none",
                  textAlign: "left",
                  color: i18n.language === lang.code ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: i18n.language === lang.code ? 600 : 400,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.target.style.background = i18n.language === lang.code ? "rgba(255,255,255,0.06)" : "none")}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
