import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import SOSModal from "./SOSModal";

const SOSButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState(null);
  const [hovered, setHovered] = useState(false);

  // Hidden on public doctor-facing emergency/scanner pages
  const isHiddenRoute =
    location.pathname.startsWith("/emergency/") || location.pathname === "/scan" || location.pathname === "/";

  // Listen to dashboard custom dispatch trigger
  useEffect(() => {
    const handleTrigger = (event) => {
      if (event.detail && event.detail.profileId) {
        setPreselectedId(event.detail.profileId);
      } else {
        setPreselectedId(null);
      }
      setIsOpen(true);
    };

    window.addEventListener("trigger-sos", handleTrigger);
    return () => {
      window.removeEventListener("trigger-sos", handleTrigger);
    };
  }, []);

  if (!user || isHiddenRoute) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "28px",
          left: "28px",
          zIndex: 900,
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            setPreselectedId(null);
            setIsOpen(true);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#E63946",
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: hovered
              ? "0 0 0 25px rgba(230,57,70,0)"
              : "0 0 0 0 rgba(230,57,70,0.7)",
            animation: hovered ? "none" : "sosPulse 1.8s infinite",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <PhoneCall size={28} />
        </motion.button>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{
                background: "rgba(230, 57, 70, 0.95)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {t("sos.button") || "SOS — Send Emergency Alert"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SOS MODAL */}
      <AnimatePresence>
        {isOpen && (
          <SOSModal
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              setPreselectedId(null);
            }}
            preselectedProfileId={preselectedId}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes sosPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(230, 57, 70, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(230, 57, 70, 0);
          }
        }
      `}</style>
    </>
  );
};

export default SOSButton;
