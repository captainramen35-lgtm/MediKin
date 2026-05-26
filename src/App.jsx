import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense } from "react";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateProfile from "./pages/CreateProfile";
import EditProfile from "./pages/EditProfile";
import QRPage from "./pages/QRPage";
import Scanner from "./pages/Scanner";
import EmergencyBrief from "./pages/EmergencyBrief";
import ChatPage from "./pages/ChatPage";

// New Expansion Pages
import RecommendationsPage from "./pages/RecommendationsPage";
import CalendarPage from "./pages/CalendarPage";
import VitalsPage from "./pages/VitalsPage";
import SOSHistory from "./pages/SOSHistory";

// SOS Button
import SOSButton from "./components/SOSButton";

// i18n init
import "./i18n";

// Pages that should not show the Navbar
const NO_NAV_ROUTES = ["/emergency/", "/chat/"];

const AppContent = () => {
  const location = useLocation();
  const showNav = !NO_NAV_ROUTES.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {showNav && <Navbar />}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/emergency/:id" element={<EmergencyBrief />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/create"
            element={
              <ProtectedRoute>
                <CreateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id/qr"
            element={
              <ProtectedRoute>
                <QRPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations/:profileId"
            element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar/:profileId"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vitals/:profileId"
            element={
              <ProtectedRoute>
                <VitalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sos-history/:profileId"
            element={
              <ProtectedRoute>
                <SOSHistory />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <div
                style={{
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "16px",
                  background: "var(--bg-primary)",
                }}
              >
                <h1
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "80px",
                    fontWeight: 800,
                    color: "var(--accent-red)",
                  }}
                >
                  404
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "18px" }}>
                  This page doesn't exist.
                </p>
                <a href="/" style={{ textDecoration: "none" }}>
                  <button className="btn-primary">Go Home</button>
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
      <SOSButton />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
