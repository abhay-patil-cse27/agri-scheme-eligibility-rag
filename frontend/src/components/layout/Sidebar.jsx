import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../NotificationCenter';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
  LayoutDashboard,
  Search,
  FileText,
  History,
  Zap,
  ChevronRight,
  Users,
  LogOut,
  Bell,
  Settings,
  Sun,
  Moon,
  Network,
  MessageSquare,
  Server
} from 'lucide-react';

const navItems = [
  { to: '/dashboard/', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/dashboard/check', icon: Search, label: 'eligibility_check' },
  { to: '/dashboard/schemes', icon: FileText, label: 'schemes' },
  { to: '/dashboard/farmers', icon: Users, label: 'farmers' },
  { to: '/dashboard/users', icon: Users, label: 'users' },
  { to: '/dashboard/history', icon: History, label: 'history' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'krishi_mitra' },
  { to: '/dashboard/graph', icon: Network, label: 'knowledge_graph' },
  { to: '/dashboard/resources', icon: Server, label: 'resources' },
  { to: '/dashboard/settings', icon: Settings, label: 'settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Filter navigation items based on role
  const filteredNavItems = navItems.filter(item => {
    // Only hide admin pages from farmer accounts
    if (user?.role === 'farmer' && 
       (item.label === 'farmers' || item.label === 'users' || item.label === 'knowledge_graph' || item.label === 'resources')) {
      return false;
    }
    return true;
  });

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        maxHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }}
    >
      {/* Logo — links to landing page */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
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
            flexShrink: 0,
          }}
        >
          <Zap size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">{t('app_name_prefix', 'Niti')}</span>
            <span style={{ color: 'var(--text-primary)' }}>{t('app_name_suffix', '-Setu')}</span>
          </h1>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
            {t('tagline')}
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {filteredNavItems.map((item) => {
          // For dashboard root, match exactly; for sub-routes match exact path
          const isActive = item.to === '/dashboard/'
            ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
            : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.label === 'Knowledge Graph' ? `${item.to}?ref=${Date.now()}` : item.to}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 4, background: 'rgba(99, 102, 241, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
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
                  {t(`sb_${item.label}`)}
                </span>
                {isActive && (
                  <ChevronRight size={16} style={{ color: 'var(--accent-indigo)' }} />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Help & Legal links */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0', padding: '0 16px', fontSize: '0.75rem' }}>
        <Link to="/faq" target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--accent-indigo)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}>FAQ</Link>
        <span style={{ color: 'var(--border-glass)' }}>|</span>
        <Link to="/privacy" target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--accent-indigo)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}>Privacy Policy</Link>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* User Card */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? t('sb_admin') : t('sb_farmer')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={logout}
              className="btn-secondary"
              style={{ flex: 1, padding: '7px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: 'none', borderRadius: '8px' }}
            >
              <LogOut size={13} /> {t('sb_logout')}
            </button>
            <button
              onClick={() => setIsNotifOpen(true)}
              style={{ width: '36px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-indigo)', border: 'none', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
              title={t('lp_footer_portal')}
            >
              <Bell size={15} />
            </button>
          </div>
        </div>

        {/* Language + Theme Row */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Language Switcher */}
          <LanguageSwitcher placement="up" />

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', flexShrink: 0 }} />

          {/* Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div
              animate={{ rotate: theme === 'light' ? 0 : 180 }}
              transition={{ duration: 0.4 }}
            >
              {theme === 'light'
                ? <Sun size={15} style={{ color: 'var(--accent-amber)' }} />
                : <Moon size={15} style={{ color: 'var(--accent-indigo)' }} />
              }
            </motion.div>
            <button
              onClick={toggleTheme}
              style={{
                position: 'relative',
                width: '40px',
                height: '22px',
                borderRadius: '100px',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: theme === 'light'
                  ? 'rgba(99, 102, 241, 0.7)'
                  : 'rgba(99, 102, 241, 0.3)',
                transition: 'background 0.3s ease',
                flexShrink: 0,
              }}
              title={theme === 'light' ? t('sb_dark_mode') : t('sb_light_mode')}
            >
              <motion.div
                animate={{ x: theme === 'light' ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  position: 'absolute',
                  top: '3px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>
        </div>

        {/* System Status */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>{t('sb_system_online')}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>RAG • Groq</span>
          </div>
        </div>
      </div>
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </aside>
  );
}
