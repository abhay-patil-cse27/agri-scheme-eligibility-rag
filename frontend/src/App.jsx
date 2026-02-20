import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from './components/layout/Sidebar';
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
import { ToastContainer } from './components/Toast';
import './index.css';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            
            <Route path="/*" element={
              <ProtectedRoute>
                <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                  <Sidebar />
                  <main
                    style={{
                      flex: 1,
                      marginLeft: '260px',
                      padding: '32px 40px',
                      minHeight: '100vh',
                      background: 'var(--gradient-bg)',
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/check" element={<EligibilityCheck />} />
                      <Route path="/schemes" element={<Schemes />} />
                      <Route path="/farmers" element={<Farmers />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}
