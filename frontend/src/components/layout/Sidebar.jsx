import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../NotificationCenter';
import {
  LayoutDashboard,
  Search,
  FileText,
  History,
  Zap,
  ChevronRight,
  Users,
  LogOut,
  Bell
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/check', icon: Search, label: 'Eligibility Check' },
  { to: '/schemes', icon: FileText, label: 'Schemes' },
  { to: '/farmers', icon: Users, label: 'Farmers' },
  { to: '/history', icon: History, label: 'History' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Filter navigation items based on role
  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'farmer' && (item.label === 'Schemes' || item.label === 'Farmers')) {
      return false;
    }
    return true;
  });

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '40px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Zap size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Niti</span>
            <span style={{ color: 'var(--text-primary)' }}>Setu</span>
          </h1>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
            Scheme Eligibility Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <item.icon
                  size={20}
                  style={{
                    color: isActive ? 'var(--accent-indigo)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight size={16} style={{ color: 'var(--accent-indigo)' }} />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* User Card */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Administrator' : 'Farmer Portal'}</p>
            </div>
          </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={logout}
                className="btn-secondary"
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: 'none', borderRadius: '8px' }}
              >
                <LogOut size={14} /> Logout
              </button>
              <button
                onClick={() => setIsNotifOpen(true)}
                style={{ width: '40px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)', border: 'none', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                title="View Notifications"
              >
                <Bell size={16} />
              </button>
            </div>
        </div>

        {/* System Status */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>System Online</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            RAG Engine • Groq LLM
          </p>
        </div>
      </div>
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </aside>
  );
}
