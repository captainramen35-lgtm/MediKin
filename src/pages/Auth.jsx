import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { createUserDoc } from "../utils/firestore";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Activity, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        await createUserDoc(user.uid, email, name);
        addToast("Account created! Welcome to MediKin.", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        addToast("Welcome back!", "success");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Email already in use"
        : err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : err.code === "auth/weak-password"
        ? "Password must be at least 6 characters"
        : err.message;
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const floatingIcons = [
    { Icon: Heart, x: "10%", y: "20%", delay: 0 },
    { Icon: Shield, x: "80%", y: "15%", delay: 0.4 },
    { Icon: Activity, x: "20%", y: "70%", delay: 0.8 },
    { Icon: Heart, x: "75%", y: "65%", delay: 1.2 },
    { Icon: Shield, x: "50%", y: "80%", delay: 0.6 },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "var(--bg-primary)",
      }}
    >
      {/* Left side */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          borderRight: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 30% 50%, rgba(230, 57, 70, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating icons */}
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              color: "rgba(230, 57, 70, 0.2)",
            }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon size={28} />
          </motion.div>
        ))}

        <div style={{ position: "relative", maxWidth: "400px", textAlign: "center" }}>
          {/* Logo */}
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "var(--accent-red)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3v22M3 14h22" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "16px",
              lineHeight: 1.2,
            }}
          >
            Your family's health,{" "}
            <span style={{ color: "var(--accent-red)" }}>always ready.</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.6 }}>
            MediKin carries complete medical histories as QR codes. Managed by
            family. Read by any doctor. In the moment that matters.
          </p>
        </div>
      </div>

      {/* Right side — form */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "32px",
            }}
          >
            {["Sign Up", "Log In"].map((label, i) => {
              const active = i === 0 ? isSignUp : !isSignUp;
              return (
                <button
                  key={label}
                  onClick={() => setIsSignUp(i === 0)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "9px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    background: active ? "var(--accent-red)" : "transparent",
                    color: active ? "white" : "var(--text-muted)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? "signup" : "login"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {isSignUp && (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    className="medikin-input"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Email Address
                </label>
                <input
                  className="medikin-input"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="medikin-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "8px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "white", display: "inline-block" }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "white", display: "inline-block" }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "white", display: "inline-block" }} />
                  </span>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-red)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
