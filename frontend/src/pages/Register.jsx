import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, googleAuth, user, loading } = useAuth();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (password.length < 6) {
      addToast(t('reg_invalid_password'), t('reg_invalid_password'), 'warning');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await register(name.trim(), email.trim(), password.trim());
      if (res.success) {
        addToast(t('reg_success'), t('reg_welcome'), 'success');
      } else {
        addToast(t('reg_failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('reg_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.success) {
        addToast(t('reg_success'), t('login_google_success'), 'success');
      } else {
        addToast(t('login_auth_failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('reg_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', marginBottom: '16px' }}>
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('reg_title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('reg_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <User size={14} /> {t('reg_name')}
            </label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="input-dark" placeholder={t('reg_name_ph')}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Mail size={14} /> {t('login_email')}
            </label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-dark" placeholder={t('login_email_ph')}
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={14} /> {t('login_password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-dark" placeholder={t('login_password_ph')}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting} className="btn-glow"
            style={{ marginTop: '12px', padding: '14px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}
          >
            {isSubmitting ? <><Loader2 size={20} className="spin" /> {t('reg_btn_loading')}</> : t('reg_btn')}
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('reg_or')}</span>
          <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              addToast(t('reg_google_failed'), t('login_google_failed_desc'), 'error');
            }}
            theme="filled_black"
            text="signup_with"
            shape="rectangular"
            size="large"
          />
        </div>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t('reg_have_account')} <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 600, textDecoration: 'none' }}>{t('reg_signin_link')}</Link>
        </p>
      </motion.div>
    </div>
  );
}


