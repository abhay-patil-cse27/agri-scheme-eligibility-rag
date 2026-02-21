import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null); // MVP Testing Flow
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      addToast(t('fp_toast_sent'), t('fp_toast_sent_desc'), 'success');
      // For MVP testing without an actual SMTP Email server like SendGrid, 
      // we catch the backend token and display it instantly.
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      addToast(t('fp_toast_failed'), err.response?.data?.error || 'Could not process request', 'error');
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
        <button onClick={() => navigate('/login')} className="btn-glass" style={{ padding: '6px 12px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> {t('fp_back_login')}
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>{t('fp_title')} <span className="gradient-text">{t('fp_title_accent')}</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
          {t('fp_subtitle')}
        </p>

        {!resetToken ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{t('fp_email_label')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  placeholder="name@example.com"
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
              {loading ? <Loader2 size={18} className="spin" /> : t('fp_btn_send')}
            </motion.button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
               <KeyRound size={20} /> {t('fp_mvp_title')}
             </div>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
               {t('fp_mvp_desc')}
             </p>
             <button 
                onClick={() => navigate(`/resetpassword/${resetToken}`)}
                className="btn-glow" 
                style={{ width: '100%', background: 'var(--gradient-success)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
               {t('fp_btn_reset_now')}
             </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
