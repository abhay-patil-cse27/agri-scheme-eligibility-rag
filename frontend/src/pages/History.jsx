import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History, CheckCircle2, XCircle, Clock, FileText, User, Calendar, ChevronDown, ChevronUp, Trash2, RefreshCw
} from 'lucide-react';
import { getProfiles, getEligibilityHistory, deleteEligibilityCheck, deleteProfile } from '../services/api';
import { useToast } from '../context/ToastContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

function HistoryCard({ check, index, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isEligible = check.eligible;
  const date = new Date(check.createdAt || check.checkedAt);

  return (
    <motion.div
      className="glass-card"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ padding: '24px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: isEligible ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${isEligible ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
            }}
          >
            {isEligible ? <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} /> :
              <XCircle size={20} style={{ color: 'var(--accent-rose)' }} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
              {check.schemeName || 'Scheme'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}>
                {isEligible ? 'Eligible' : 'Not Eligible'}
              </span>
              <span className={`badge badge-${check.confidence === 'high' ? 'success' : check.confidence === 'medium' ? 'warning' : 'info'}`}>
                {check.confidence}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {check.responseTime}s
            </p>
          </div>
          {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> :
            <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>REASON</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{check.reason}</p>
          </div>

          {check.citation && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>CITATION</p>
              <blockquote style={{
                padding: '12px 16px', borderRadius: '10px', borderLeft: '3px solid var(--accent-amber)',
                background: 'rgba(245,158,11,0.05)', fontStyle: 'italic',
                fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                "{check.citation}"
              </blockquote>
            </div>
          )}

          {check.benefitAmount && (
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              Benefit: ₹{Number(check.benefitAmount).toLocaleString()}
            </p>
          )}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(check._id); }}
              style={{
                background: 'none', border: 'none', color: 'var(--accent-rose)', 
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                cursor: 'pointer', padding: '6px 12px', borderRadius: '6px'
              }}
            >
              <Trash2 size={14} /> Delete Record
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getProfiles()
      .then((p) => {
        const profs = p.data || [];
        setProfiles(profs);
        if (profs.length > 0) setSelectedProfile(profs[0]._id);
      })
      .finally(() => setLoadingProfiles(false));
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    setLoading(true);
    getEligibilityHistory(selectedProfile)
      .then((h) => setChecks(h.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProfile]);

  const handleDelete = async (id) => {
    try {
      await deleteEligibilityCheck(id);
      setChecks(checks.filter((c) => c._id !== id));
      addToast('Record Deleted', 'Eligibility check removed from history', 'info');
    } catch (e) {
      console.error('Failed to delete check', e);
      addToast('Deletion Failed', 'Could not delete the record', 'error');
    }
  };

  const handleReuseProfile = () => {
    const profile = profiles.find(p => p._id === selectedProfile);
    if (profile) {
      navigate('/check', { state: { profile } });
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete this profile and all its eligibility check history? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteProfile(selectedProfile);
      // Remove from local list
      const remainingProfiles = profiles.filter(p => p._id !== selectedProfile);
      setProfiles(remainingProfiles);
      
      // Auto select next available
      if (remainingProfiles.length > 0) {
        setSelectedProfile(remainingProfiles[0]._id);
      } else {
        setSelectedProfile('');
        setChecks([]);
      }
      addToast('Profile Deleted', 'Farmer profile and all history wiped successfully', 'success');
    } catch (e) {
      console.error('Failed to delete profile', e);
      addToast('Deletion Failed', 'Could not delete the farmer profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <History size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-cyan)' }} />
          Check <span className="gradient-text">History</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Past eligibility checks with full citation trails
        </p>
      </motion.div>

      {/* Profile Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '20px', marginBottom: '24px' }}
      >
        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} /> Select Farmer Profile
        </label>
        {loadingProfiles ? (
          <div className="shimmer" style={{ height: '44px', borderRadius: '12px' }} />
        ) : profiles.length === 0 ? (
          <div style={{
            padding: '12px 16px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: '12px', border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic'
          }}>
            No profiles found. Create a profile on the Eligibility Check page first.
          </div>
        ) : (
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="select-dark"
          >
            {profiles.map((p) => (
              <option key={p._id} value={p._id}>{p.name} — {p.state} ({p.landHolding} acres)</option>
            ))}
          </select>
        )}
        
        {!loadingProfiles && profiles.length > 0 && selectedProfile && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              onClick={handleDeleteProfile}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', fontSize: '0.85rem',
                background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px',
                cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
            >
              <Trash2 size={14} /> Delete Profile & History
            </button>
            <button
              onClick={handleReuseProfile}
              className="btn-glow"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={14} /> Run New Check for this Profile
            </button>
          </div>
        )}
      </motion.div>

      {/* History List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: '90px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : checks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card"
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <History size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>No eligibility checks yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Run your first eligibility check from the Check page</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checks.map((check, i) => (
            <HistoryCard key={check._id} check={check} index={i} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
