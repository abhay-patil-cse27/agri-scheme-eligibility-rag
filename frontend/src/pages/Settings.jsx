import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, KeyRound, Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateDetails, updatePassword } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [details, setDetails] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setDetailsLoading(true);
    try {
      await updateDetails(details);
      addToast('Profile Updated', 'Your profile details have been saved.', 'success');
      // In a full implementation, we'd sync this up to the AuthContext state globally
      // But for MVP, reloading the page or trusting the next session fetches the right data is sufficient.
    } catch (err) {
      addToast('Update Failed', err.response?.data?.error || 'Could not update profile', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast('Password Mismatch', 'New passwords do not match', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      await updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      addToast('Password Changed', 'Your password was successfully updated.', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast('Update Failed', err.response?.data?.error || 'Could not change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <User size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
          Account <span className="gradient-text">Settings</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Manage your personal information and security preferences.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Update Details */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleDetailsSubmit}
          className="glass-card"
          style={{ padding: '28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <User size={20} style={{ color: 'var(--accent-violet)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Profile Information</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="text" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} />
              </div>
            </div>
          </div>
          <motion.button type="submit" disabled={detailsLoading} className="btn-glow" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {detailsLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {detailsLoading ? 'Saving...' : 'Save Profile'}
          </motion.button>
        </motion.form>

        {/* Update Password */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handlePasswordSubmit}
          className="glass-card"
          style={{ padding: '28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Lock size={20} style={{ color: 'var(--accent-amber)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Change Password</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder="Enter current password" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder="Must be at least 8 characters with numbers & symbols" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder="Retype new password" />
              </div>
            </div>
          </div>
          <motion.button type="submit" disabled={passwordLoading} className="btn-glow" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gradient-amber)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
            {passwordLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px',
};
