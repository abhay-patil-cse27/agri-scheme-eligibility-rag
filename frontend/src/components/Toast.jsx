import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ICONS = {
  success: <CheckCircle2 size={20} color="var(--accent-emerald)" />,
  error: <AlertCircle size={20} color="var(--accent-rose)" />,
  warning: <AlertTriangle size={20} color="var(--accent-amber)" />,
  info: <Info size={20} color="var(--accent-indigo)" />,
};

const BORDERS = {
  success: '1px solid rgba(16, 185, 129, 0.3)',
  error: '1px solid rgba(244, 63, 94, 0.3)',
  warning: '1px solid rgba(245, 158, 11, 0.3)',
  info: '1px solid rgba(99, 102, 241, 0.3)',
};

const BACKGROUNDS = {
  success: 'rgba(16, 185, 129, 0.05)',
  error: 'rgba(244, 63, 94, 0.05)',
  warning: 'rgba(245, 158, 11, 0.05)',
  info: 'rgba(99, 102, 241, 0.05)',
};

export const Toast = ({ toast }) => {
  const { removeToast } = useToast();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
      style={{
        width: '320px',
        padding: '16px',
        background: 'rgba(17, 17, 24, 0.95)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        border: BORDERS[toast.type],
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background tinted wash */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: BACKGROUNDS[toast.type], pointerEvents: 'none'
      }} />

      <div style={{ flexShrink: 0, zIndex: 1 }}>
        {ICONS[toast.type]}
      </div>
      
      <div style={{ flex: 1, zIndex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {toast.title}
        </h4>
        {toast.message && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', zIndex: 1,
          borderRadius: '50%', transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
