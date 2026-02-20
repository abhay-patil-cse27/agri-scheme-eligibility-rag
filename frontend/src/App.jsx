import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from './components/layout/Sidebar';
import LandingNav from './components/layout/LandingNav';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import EligibilityCheck from './pages/EligibilityCheck';
import Schemes from './pages/Schemes';
import HistoryPage from './pages/History';
import Farmers from './pages/Farmers';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/Toast';
import './index.css';

/* ── Authenticated app shell with Sidebar ── */
function AppShell() {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: '260px',
          padding: '32px 40px',
          minHeight: '100vh',
          background: 'var(--gradient-bg)',
        }}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ── Public auth pages (with shared landing nav) ── */
function AuthShell() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <LandingNav />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Landing />} />

            {/* Auth pages — share the LandingNav */}
            <Route element={<AuthShell />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/resetpassword/:token" element={<ResetPassword />} />
            </Route>

            {/* Protected app — proper nested Outlet routing */}
            <Route path="/dashboard" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="check" element={<EligibilityCheck />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="farmers" element={<Farmers />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
