import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (password.length < 6) {
      addToast('Invalid Password', 'Password must be at least 6 characters', 'warning');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await register(name.trim(), email.trim(), password.trim());
      if (res.success) {
        addToast('Registration Successful', 'Welcome to Niti-Setu', 'success');
      } else {
        addToast('Registration Failed', res.error, 'error');
      }
    } catch (err) {
      addToast('System Error', 'An unexpected error occurred during registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Farmer Registration</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <User size={14} /> Full Name
            </label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="input-dark" placeholder="Enter your name"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-dark" placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={14} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-dark" placeholder="Create a password (min 6)"
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
            {isSubmitting ? <><Loader2 size={20} className="spin" /> Registering...</> : 'Register'}
          </motion.button>
        </form>

        <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 600, textDecoration: 'none' }}>Sign In here</Link>
        </p>
      </motion.div>
    </div>
  );
}
