import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AgriCard from './AgriCard';

const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName,
  isDeleting = false 
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const confirmText = 'confirm'; // We keep the keyword consistent for security stability

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (inputValue.toLowerCase() === confirmText) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: '450px' }}
        >
          <AgriCard 
            animate={false} 
            padding="32px" 
            style={{ 
              border: '1px solid rgba(244, 63, 94, 0.3)',
              background: 'rgba(23, 23, 23, 0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '12px', 
                background: 'rgba(244, 63, 94, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-rose)'
              }}>
                <AlertTriangle size={24} />
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
              {title || t('cm_confirm_delete_title')}
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {message || t('cm_confirm_delete_msg')}
              {itemName && <strong style={{ color: 'var(--accent-rose)', display: 'block', marginTop: '8px' }}>"{itemName}"</strong>}
            </p>

            <form onSubmit={handleConfirm}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {t('cm_confirm_delete_type_msg').replace('{{confirmText}}', confirmText)}
                </label>
                <input 
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('cm_confirm_delete_placeholder')}
                  className="input-dark"
                  style={{ 
                    borderColor: inputValue.toLowerCase() === confirmText ? 'var(--accent-emerald)' : 'var(--border-glass)',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}
                >
                  {t('cm_cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={inputValue.toLowerCase() !== confirmText || isDeleting}
                  className="btn-glow"
                  style={{ 
                    flex: 1.5, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: inputValue.toLowerCase() === confirmText ? 'var(--accent-rose)' : 'rgba(244,63,94,0.1)',
                    color: inputValue.toLowerCase() === confirmText ? '#fff' : 'rgba(244,63,94,0.4)',
                    boxShadow: inputValue.toLowerCase() === confirmText ? '0 8px 20px rgba(244,63,94,0.3)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Trash2 size={18} />
                  {isDeleting ? '...' : t('cm_confirm_delete_btn')}
                </button>
              </div>
            </form>
          </AgriCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
