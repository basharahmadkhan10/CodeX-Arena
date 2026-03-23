import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import useSocketEvents from "./hooks/useSocketEvents";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import BattlePage from "./pages/BattlePage";

function SocketEventManager() {
  useSocketEvents();
  return null;
}

function RequireAuth({ children }) {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized)
    return (
      <div className="min-h-screen bg-[rgb(238,11,22)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-3" />
          <p className="text-black/40 text-sm font-bold">Loading...</p>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { init, user } = useAuthStore();

  useEffect(() => {
    init();
  }, []); // run once only

  return (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      {user && <SocketEventManager />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#000",
            border: "2px solid #000",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "3px 3px 0px #000",
          },
          success: { iconTheme: { primary: "#00c8c8", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/battle"
          element={
            <RequireAuth>
              <BattlePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
