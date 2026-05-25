import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const TOAST_STYLES = {
  success: {
    border: "1px solid rgba(46, 196, 182, 0.3)",
    background: "rgba(46, 196, 182, 0.12)",
    icon: "✓",
    color: "#2EC4B6",
  },
  error: {
    border: "1px solid rgba(230, 57, 70, 0.3)",
    background: "rgba(230, 57, 70, 0.12)",
    icon: "✕",
    color: "#E63946",
  },
  warning: {
    border: "1px solid rgba(244, 162, 97, 0.3)",
    background: "rgba(244, 162, 97, 0.12)",
    icon: "⚠",
    color: "#F4A261",
  },
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      pointerEvents: "none",
    }}
  >
    {toasts.map((toast) => {
      const s = TOAST_STYLES[toast.type] || TOAST_STYLES.success;
      return (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          style={{
            background: "rgba(15, 21, 37, 0.95)",
            backdropFilter: "blur(12px)",
            border: s.border,
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: "280px",
            maxWidth: "380px",
            cursor: "pointer",
            pointerEvents: "all",
            animation: "slideIn 0.3s ease",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: s.background,
              border: s.border,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: s.color,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </span>
          <span
            style={{
              color: "#F0F4FF",
              fontSize: "14px",
              fontFamily: "'DM Sans', sans-serif",
              flex: 1,
            }}
          >
            {toast.message}
          </span>
        </div>
      );
    })}
    <style>{`
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `}</style>
  </div>
);

export default ToastContext;
