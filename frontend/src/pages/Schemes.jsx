import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Trash2, Loader2, Plus, X, CheckCircle2, BarChart3
} from 'lucide-react';
import { getSchemes, uploadScheme, deleteScheme } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const categoryColors = {
  income_support: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  infrastructure: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  energy: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  other: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
};

function UploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !name) return;
    setUploading(true);
    addToast('Processing Document', 'Extracting text and building vector embeddings...', 'info');
    
    try {
      const result = await uploadScheme(file, name, desc, category);
      if (result.success) {
        addToast('Scheme Uploaded', `${name} successfully added to the knowledge base.`, 'success');
        onUpload();
        onClose();
      } else {
        addToast('Upload Failed', result.error || 'Could not process PDF document', 'error');
      }
    } catch (e) {
      addToast('System Error', e.response?.data?.error || e.message || 'An unexpected error occurred', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card"
        style={{ width: '480px', maxWidth: '90vw', padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            <Upload size={20} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
            Upload Scheme PDF
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Scheme Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PM-KISAN" className="input-dark" required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description" className="input-dark" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-dark">
              <option value="income_support">Income Support</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="energy">Energy</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>PDF File *</label>
            <div
              style={{
                padding: '24px', borderRadius: '12px', textAlign: 'center',
                border: '2px dashed var(--border-glass)', cursor: 'pointer',
                background: file ? 'rgba(99,102,241,0.05)' : 'var(--bg-glass)',
              }}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <p style={{ color: 'var(--accent-indigo)', fontWeight: 500 }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Click to select PDF file</p>
              )}
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>

          <button type="submit" className="btn-glow" disabled={uploading || !file || !name}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {uploading ? <><Loader2 size={18} className="spin" /> Processing PDF...</> : <><Upload size={18} /> Upload & Process</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 500,
  color: 'var(--text-secondary)', marginBottom: '8px',
};

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const loadSchemes = async () => {
    try {
      const data = await getSchemes();
      setSchemes(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchemes(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheme and all its chunks?')) return;
    setDeleting(id);
    try {
      await deleteScheme(id);
      setSchemes((prev) => prev.filter((s) => s._id !== id));
      addToast('Scheme Deleted', 'Knowledge base updated successfully', 'success');
    } catch (e) {
      console.error('Failed to delete scheme', e);
      addToast('Deletion Failed', 'Could not remove the scheme document', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-violet)' }} />
            Government <span className="gradient-text">Schemes</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {isAdmin
              ? `Upload PDFs to build the knowledge base — ${schemes.length} schemes loaded`
              : `Browse available government schemes — ${schemes.length} schemes indexed`
            }
          </p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-glow"
            onClick={() => setShowUpload(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Upload PDF
          </motion.button>
        )}
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer" style={{ height: '180px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card"
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>No schemes uploaded</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Upload government scheme PDFs to power the eligibility engine</p>
          <button className="btn-glow" onClick={() => setShowUpload(true)}>
            <Upload size={16} style={{ display: 'inline', marginRight: '8px' }} /> Upload First PDF
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {schemes.map((scheme, i) => {
            const cat = categoryColors[scheme.category] || categoryColors.other;
            return (
              <motion.div
                key={scheme._id}
                className="glass-card"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>{scheme.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {scheme.description || 'Government scheme document'}
                    </p>
                  </div>
                  <span className="badge" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, marginLeft: '12px' }}>
                    {scheme.category?.replace('_', ' ') || 'other'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>CHUNKS</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{scheme.totalChunks}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>VERSION</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{scheme.version || 1}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>STATUS</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 500 }}>Indexed</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(scheme._id)}
                      disabled={deleting === scheme._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)',
                        fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {deleting === scheme._id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                      Delete
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={loadSchemes} />}
      </AnimatePresence>
    </div>
  );
}
