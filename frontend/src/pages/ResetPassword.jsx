import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Mismatch', 'Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      addToast('Success', 'Password has been reset.', 'success');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      addToast('Reset Failed', err.response?.data?.error || 'Invalid or expired token', 'error');
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
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Create New <span className="gradient-text">Password</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Your new password must be at least 8 characters long and contain numbers and symbols.
        </p>

        {success ? (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
             <CheckCircle2 size={40} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px' }} />
             <h4 style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '8px' }}>Password Reset Successfully!</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Redirecting you to login...</p>
           </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '12px', left: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  placeholder="Confirm new password"
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
              {loading ? <Loader2 size={18} className="spin" /> : 'Update Password'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
