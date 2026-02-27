import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scanDocument } from '../../services/api';

/**
 * Phase 4: Ephemeral Auto-Scan UI Component
 * Allows users to upload a document to auto-fill their profile.
 * Implements strict zero-retention consent logic.
 */
export default function DocumentScanner({ onDataExtracted }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('7/12 Land Record');
  const [hasConsent, setHasConsent] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(uploadedFile.type)) {
      setError('Only JPG and PNG images are supported.');
      return;
    }
    if (uploadedFile.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB.');
      return;
    }
    setFile(uploadedFile);
  };

  const clearFile = () => {
    setFile(null);
    setHasConsent(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!file || !hasConsent) return;
    
    setIsScanning(true);
    setError('');
    
    try {
      const response = await scanDocument(file, docType);
      if (response.success && response.data) {
        onDataExtracted(response.data);
        clearFile();
      } else {
        setError(response.error || 'Failed to extract data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Network error during scan.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ 
      margin: '24px 0', 
      padding: '24px', 
      background: 'rgba(99, 102, 241, 0.05)', 
      borderRadius: '16px', 
      border: '1px dashed var(--accent-indigo)' 
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} style={{ color: 'var(--accent-indigo)' }}/>
          Fast Fill via Document Scan (Optional)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Upload your 7/12 extract or ID card. Our AI will automatically extract your name, state, and land holding securely.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              border: `2px dashed ${isDragging ? 'var(--accent-indigo)' : 'var(--border-glass)'}`,
              borderRadius: '12px',
              background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: error ? '12px' : '0'
            }}
          >
            <input 
              ref={fileInputRef} type="file" accept="image/jpeg, image/png" 
              onChange={handleChange} style={{ display: 'none' }} 
            />
            <FileImage size={32} style={{ color: isDragging ? 'var(--accent-indigo)' : 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Drag and drop your image here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports JPG, PNG (Max 15MB)
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '16px',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={clearFile} disabled={isScanning} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Document Type</label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)}
                disabled={isScanning}
                className="select-dark"
                style={{ fontSize: '0.9rem', padding: '8px 12px' }}
              >
                <option value="7/12 Land Record">7/12 Land Record (Satbara)</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Kisan Credit Card">Kisan Credit Card</option>
                <option value="Other Official ID">Other Official ID</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(255,165,0,0.05)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.2)' }}>
              <input 
                type="checkbox" 
                checked={hasConsent} 
                onChange={(e) => setHasConsent(e.target.checked)}
                disabled={isScanning}
                style={{ marginTop: '2px', accentColor: 'var(--accent-indigo)' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Privacy Consent:</strong> I agree to have this document temporarily scanned by AI to fill my profile. I understand the image will be <strong>permanently and immediately deleted</strong> from the server after scanning.
              </span>
            </label>

            <button
              onClick={handleScan}
              disabled={!hasConsent || isScanning}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                opacity: (!hasConsent || isScanning) ? 0.6 : 1,
                cursor: (!hasConsent || isScanning) ? 'not-allowed' : 'pointer'
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 size={16} className="spin" /> Scanning Document securely...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Scan & Auto-Fill
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertCircle size={14} /> {error}
        </motion.p>
      )}
    </div>
  );
}
