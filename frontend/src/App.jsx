import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalLoader from './components/common/GlobalLoader';
import Aurora from './components/Aurora';
// Lazy load the heaviest pages that will contain 3D components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schemes = lazy(() => import('./pages/Schemes'));
const Landing = lazy(() => import('./pages/Landing'));
const EligibilityCheck = lazy(() => import('./pages/EligibilityCheck'));
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'));

import Sidebar from './components/layout/Sidebar';
import LandingNav from './components/layout/LandingNav';
import HistoryPage from './pages/History';
import Farmers from './pages/Farmers';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastContainer } from './components/Toast';
import './index.css';

/* ── Authenticated app shell with Sidebar ── */
function AppShell() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <ProtectedRoute>
      <div style={{ position: 'relative', display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar />
        <main style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          marginLeft: '260px',
          padding: '32px 40px',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ── Public auth pages (with shared landing nav + agricultural background) ── */
function AuthShell() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark
    ? 'radial-gradient(ellipse at top, #0c170c 0%, #060d06 70%)'
    : 'linear-gradient(160deg, #faf7ee 0%, #f2ead8 45%, #f7f2e4 100%)';
  const dotColor = isDark ? 'rgba(34,197,94,0.05)' : 'rgba(101,67,33,0.07)';
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: bg,
      backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px), ${bg}`,
      backgroundSize: '28px 28px, 100% 100%',
    }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
        <Aurora
          colorStops={
            isDark 
            ? ['#16a34a', '#166534', '#060d06'] 
            : ['#4ade80', '#16a34a', '#dcfce7']
          }
          speed={0.3}
        />
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <LandingNav />
        <Outlet />
      </div>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  in: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transitionEnd: {
      transform: 'none',
      filter: 'none'
    }
  },
  out: { opacity: 0, scale: 1.02, filter: 'blur(4px)' }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Wrapper for animated routes
const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing page */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />

        {/* Public auth pages — share the LandingNav */}
        <Route element={<AuthShell />}>
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgotpassword" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/resetpassword/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
          {/* Public Eligibility Check Tool (unauthenticated / guest) */}
          <Route path="/check" element={<PageWrapper><EligibilityCheck /></PageWrapper>} />
        </Route>

        {/* Protected app — proper nested Outlet routing inside Sidebar shell */}
        <Route path="/dashboard" element={<AppShell />}>
          <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
          {/* Authenticated Eligibility Check renders INSIDE the Sidebar layout */}
          <Route path="check" element={<PageWrapper><EligibilityCheck /></PageWrapper>} />
          <Route path="schemes" element={<PageWrapper><Schemes /></PageWrapper>} />
          <Route path="farmers" element={<PageWrapper><Farmers /></PageWrapper>} />
          <Route path="history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="users" element={<PageWrapper><UsersPage /></PageWrapper>} />
          <Route path="graph" element={<PageWrapper><GraphExplorer /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<GlobalLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
