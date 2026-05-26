import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { generateChatResponse } from "../utils/groq";
import { Send, Bot, User, Zap, ArrowLeft } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What does the first medication do?",
  "What warning signs should I watch for?",
  "Are any of these medications dangerous together?",
  "When should I call an ambulance?",
];

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading } = useProfile(id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || thinking || !profile) return;

    setInput("");
    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);

    try {
      const groqMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = `You are a helpful medical assistant for a family managing a loved one's health profile. 
The patient's profile: ${JSON.stringify(profile)}
Answer questions about their conditions, medications, what symptoms to watch for, and when to seek emergency care. 
Never replace professional medical advice. Always recommend consulting a doctor for serious concerns. Keep answers clear and non-technical unless asked otherwise.`;

      const reply = await generateChatResponse(profile, groqMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI assistant. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggest = (q) => {
    // For the first medication, replace placeholder
    let question = q;
    if (q.includes("first medication") && profile?.medications?.length > 0) {
      question = `What does ${profile.medications[0].name} do?`;
    }
    sendMessage(question);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="typing-dot"
              style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-blue)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(15, 21, 37, 0.9)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexShrink: 0,
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-ghost animate-hover"
          style={{
            padding: "8px 12px",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginRight: "4px",
            height: "36px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            cursor: "pointer",
            color: "var(--text-primary)",
            transition: "all 0.2s ease",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-blue), #7b9cff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={22} color="white" />
        </div>
        <div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            MediKin AI Assistant
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Asking about{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {profile?.patient?.name}
            </strong>
          </p>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--success)",
              boxShadow: "0 0 6px var(--success)",
            }}
          />
          <span style={{ fontSize: "12px", color: "var(--success)" }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-blue), #7b9cff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bot size={18} color="white" />
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "14px 18px",
                  maxWidth: "480px",
                }}
              >
                <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                  Hi! I'm your MediKin AI assistant. I'm familiar with{" "}
                  <strong>{profile?.patient?.name}</strong>'s medical profile. Ask me anything about their conditions, medications, or what to watch out for.
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "8px",
                  }}
                >
                  ⚠ I'm not a substitute for professional medical advice.
                </p>
              </div>
            </div>

            {/* Suggested questions */}
            <div style={{ paddingLeft: "46px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Suggested questions:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggest(q)}
                    style={{
                      background: "rgba(67, 97, 238, 0.1)",
                      border: "1px solid rgba(67, 97, 238, 0.25)",
                      borderRadius: "100px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      color: "#7b9cff",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(67, 97, 238, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(67, 97, 238, 0.1)";
                    }}
                  >
                    {q.includes("first medication") && profile?.medications?.length > 0
                      ? `What does ${profile.medications[0].name} do?`
                      : q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Chat messages */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-blue), #7b9cff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} color="white" />
                </div>
              )}

              <div
                style={{
                  maxWidth: "520px",
                  padding: "14px 18px",
                  borderRadius:
                    msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  background:
                    msg.role === "user"
                      ? "var(--accent-blue)"
                      : msg.error
                      ? "rgba(230, 57, 70, 0.1)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    msg.role === "user"
                      ? "none"
                      : msg.error
                      ? "1px solid rgba(230, 57, 70, 0.2)"
                      : "1px solid var(--border)",
                  fontSize: "14px",
                  color: msg.role === "user" ? "white" : "var(--text-primary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>

              {msg.role === "user" && (
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={16} color="var(--text-muted)" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {thinking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent-blue), #7b9cff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={18} color="white" />
            </div>
            <div
              style={{
                padding: "14px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: "16px 16px 16px 4px",
                display: "flex",
                gap: "5px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="typing-dot"
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          background: "rgba(15, 21, 37, 0.9)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "12px", maxWidth: "860px", margin: "0 auto" }}>
          <input
            ref={inputRef}
            className="medikin-input"
            placeholder="Ask something about this patient..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={thinking}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={thinking || !input.trim()}
            className="btn-blue"
            style={{
              padding: "12px 18px",
              flexShrink: 0,
              opacity: thinking || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
