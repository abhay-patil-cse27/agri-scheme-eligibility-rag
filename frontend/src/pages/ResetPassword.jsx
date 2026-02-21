import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast(t('rp_mismatch'), t('rp_mismatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      addToast(t('rp_success_title'), t('rp_toast_success'), 'success');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      addToast(t('fp_toast_failed'), err.response?.data?.error || t('rp_toast_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', padding: '32px' }}
      >
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>{t('rp_title')} <span className="gradient-text">{t('rp_title_accent')}</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
          {t('rp_subtitle')}
        </p>

        {success ? (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
             <CheckCircle2 size={40} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px' }} />
             <h4 style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '8px' }}>{t('rp_success_title')}</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('rp_success_desc')}</p>
           </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{t('rp_new_password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  placeholder={t('rp_new_password_ph')}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{t('rp_confirm_password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  placeholder={t('rp_confirm_password_ph')}
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-glow"
              style={{ padding: '12px', fontSize: '1rem', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : t('rp_btn_update')}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
