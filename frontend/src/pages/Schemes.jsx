import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Trash2, Loader2, Plus, X, CheckCircle2, ExternalLink 
} from 'lucide-react';
import { getSchemes, uploadScheme, deleteScheme } from '../services/api';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { CATEGORY_LINKS } from '../services/categoryService';
import AgriCard from '../components/common/AgriCard';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const categoryColors = {
  income_support: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  infrastructure: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  energy: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  insurance: { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
  credit: { bg: 'rgba(236,72,153,0.1)', text: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  soil: { bg: 'rgba(217,119,6,0.1)', text: '#d97706', border: 'rgba(217,119,6,0.2)' },
  horticulture: { bg: 'rgba(132,204,22,0.1)', text: '#84cc16', border: 'rgba(132,204,22,0.2)' },
  livestock: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
  other: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
};

function UploadModal({ onClose, onUpload, prefilledScheme = null }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [name, setName] = useState(prefilledScheme ? prefilledScheme.name : '');
  const [desc, setDesc] = useState(prefilledScheme ? (prefilledScheme.description || '') : '');
  const [category, setCategory] = useState(prefilledScheme ? (prefilledScheme.category || 'other') : 'other');
  
  // New Document Fields
  const [docType, setDocType] = useState('guidelines');
  const [state, setState] = useState('All');
  const [language, setLanguage] = useState('en');
  
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !name) return;
    setUploading(true);
    addToast('Processing Document', 'Extracting text and building vector embeddings...', 'info');
    
    try {
      const result = await uploadScheme(file, name, desc, category, docType, state, language);
      if (result.success) {
        addToast('Document Uploaded', `Successfully added document to ${name}.`, 'success');
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
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ width: '500px', maxWidth: '95vw', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
        padding="32px"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            <Upload size={20} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
            {prefilledScheme ? `Add Document to ${prefilledScheme.name}` : t('sh_upload_pdf')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('sh_name')} *</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('sh_name_ph')} 
              className="input-dark" 
              required 
              disabled={!!prefilledScheme}
              style={prefilledScheme ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('sh_desc')}</label>
            <input 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              placeholder={t('sh_desc_ph')} 
              className="input-dark" 
              disabled={!!prefilledScheme}
              style={prefilledScheme ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('sh_tbl_category')}</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="select-dark"
              disabled={!!prefilledScheme}
              style={prefilledScheme ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <option value="income_support">Income Support</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="energy">Energy</option>
              <option value="insurance">Insurance</option>
              <option value="credit">Credit</option>
              <option value="soil">Soil</option>
              <option value="horticulture">Horticulture</option>
              <option value="livestock">Livestock</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Document configuration row (side-by-side) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="select-dark">
                <option value="guidelines">Official Guidelines</option>
                <option value="amendment">Official Amendment</option>
                <option value="state_addendum">State Addendum</option>
                <option value="faq">FAQ / Q&A</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Document Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select-dark">
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="pa">Punjabi (ਪੰਜਾਬี)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Target State / Region</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="select-dark">
              <option value="All">All States (National)</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Arunachal Pradesh">Arunachal Pradesh</option>
              <option value="Assam">Assam</option>
              <option value="Bihar">Bihar</option>
              <option value="Chhattisgarh">Chhattisgarh</option>
              <option value="Goa">Goa</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Haryana">Haryana</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Kerala">Kerala</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Manipur">Manipur</option>
              <option value="Meghalaya">Meghalaya</option>
              <option value="Mizoram">Mizoram</option>
              <option value="Nagaland">Nagaland</option>
              <option value="Odisha">Odisha</option>
              <option value="Punjab">Punjab</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Sikkim">Sikkim</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Telangana">Telangana</option>
              <option value="Tripura">Tripura</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Uttarakhand">Uttarakhand</option>
              <option value="West Bengal">West Bengal</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t('sh_file')} *</label>
            <div
              style={{
                padding: '24px', borderRadius: '12px', textAlign: 'center',
                border: '1px dashed var(--border-color)', cursor: 'pointer',
                background: file ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
              }}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <p style={{ color: 'var(--accent-indigo)', fontWeight: 500 }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>{t('sh_file_select')}</p>
              )}
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>

          <button type="submit" className="btn-glow" disabled={uploading || !file || !name}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {uploading ? <><Loader2 size={18} className="spin" /> {t('sh_btn_uploading')}</> : <><Upload size={18} /> {t('sh_btn_upload')}</>}
          </button>
        </form>
      </AgriCard>
    </motion.div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 500,
  color: 'var(--text-secondary)', marginBottom: '8px',
};

export default function Schemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [prefilledScheme, setPrefilledScheme] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadSchemes = async () => {
    try {
      const data = await getSchemes();
      setSchemes(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchemes(); }, []);

  const categorizedSchemes = schemes.reduce((acc, scheme) => {
    const cat = scheme.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(scheme);
    return acc;
  }, {});

  const handleDeleteClick = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleting(id);
    setDeleteId(null);
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
    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: '32px', marginBottom: '24px' }}
      padding="32px"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-violet)' }} />
            {t('sh_title')}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('sh_subtitle')}
          </p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-glow"
            onClick={() => {
              setPrefilledScheme(null);
              setShowUpload(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> {t('sh_add_new')}
          </motion.button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer" style={{ height: '180px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <div
          className="agri-card"
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{t('sh_empty')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{t('sh_upload_desc')}</p>
          <button className="btn-glow" onClick={() => setShowUpload(true)}>
            <Upload size={16} style={{ display: 'inline', marginRight: '8px' }} /> {t('sh_add_new')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(categorizedSchemes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([catName, catSchemes]) => (
            <div key={catName}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: categoryColors[catName]?.text || 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {catName.replace(/_/g, ' ')} ({catSchemes.length})
                </h2>
                {CATEGORY_LINKS[catName] && (
                  <a 
                    href={CATEGORY_LINKS[catName]} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(56,189,248,0.2)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                  >
                    Direct Portal <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {catSchemes.map((scheme, i) => {
                  const cat = categoryColors[scheme.category] || categoryColors.other;
                  return (
                    <motion.div
                      key={scheme._id || `scheme-${scheme.name}-${i}`}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      style={{ height: "100%" }}
                    >
                      <AgriCard
                        animate={true}
                        className="agri-card relative z-10"
                        style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
                        padding="24px"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', position: 'relative', zIndex: 1, gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px', wordBreak: 'break-word' }}>{scheme.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {scheme.description || t('sh_govt_scheme_doc')}
                            </p>
                          </div>
                          <span className="badge" style={{ whiteSpace: 'nowrap', background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, flexShrink: 0 }}>
                            {scheme.category?.replace(/_/g, ' ') || 'other'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', position: 'relative', zIndex: 1, flex: 1, alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('sh_tbl_chunks').toUpperCase()}</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{scheme.totalChunks || 0}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('sh_tbl_version')}</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{scheme.version || '1.0'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('sh_tbl_status').toUpperCase()}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} />
                              <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 500 }}>{t('sh_active')}</span>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1, marginTop: 'auto', gap: '8px' }}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setPrefilledScheme(scheme);
                                setShowUpload(true);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo)',
                                fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              <Plus size={14} /> Add Document
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteClick(scheme._id, scheme.name)}
                              disabled={deleting === scheme._id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)',
                                fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              {deleting === scheme._id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                              {t('sh_delete')}
                            </motion.button>
                          </div>
                        )}
                      </AgriCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AgriCard>

      <AnimatePresence>
        {showUpload && (
          <UploadModal 
            onClose={() => {
              setShowUpload(false);
              setPrefilledScheme(null);
            }} 
            onUpload={loadSchemes} 
            prefilledScheme={prefilledScheme}
          />
        )}
        
        <ConfirmDeleteModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
          itemName={deleteName}
          isDeleting={!!deleting}
        />
      </AnimatePresence>
    </div>
  );
}
