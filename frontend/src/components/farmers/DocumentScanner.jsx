import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, FileText, CheckCircle2, Loader2, AlertCircle, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scanDocument } from '../../services/api';

/**
 * Phase 4: Ephemeral Auto-Scan UI Component
 * Allows users to upload a document to auto-fill their profile.
 * Implements strict zero-retention consent logic.
 */
export default function DocumentScanner({ onDataExtracted, checkConsent }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('7/12 Land Record');
  const [hasConsent, setHasConsent] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [landUnit, setLandUnit] = useState('Hectares'); // Default for Satbara
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [stream, setStream] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = React.useRef(null);
  const liveVideoRef = React.useRef(null);

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

  // Allowed MIME types & extensions (both must match — defense against file spoofing)
  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf'
  ]);
  const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.heic', '.heif']);

  const validateAndSetFile = (uploadedFile) => {
    const ext = '.' + uploadedFile.name.split('.').pop().toLowerCase();
    const mime = uploadedFile.type.toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
      setError('Unsupported file type. Please upload a JPG, PNG, PDF, WebP, or HEIC file.');
      return;
    }
    // Extra guard: extension/mime cross-check (e.g. file.pdf with image/jpeg is rejected)
    const mimeGroup = mime.startsWith('image/') ? 'image' : 'document';
    const extGroup = ext === '.pdf' ? 'document' : 'image';
    if (mimeGroup !== extGroup) {
      setError('File type mismatch. The file extension does not match its content.');
      return;
    }
    if (uploadedFile.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB.');
      return;
    }
    setFile(uploadedFile);
  };

  // Auto-scan the moment a file is set — consent was already given via the Privacy Modal
  React.useEffect(() => {
    if (file) {
      setHasConsent(true);
    }
  }, [file]);

  React.useEffect(() => {
    if (file && hasConsent) {
      handleScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConsent]);

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
      const response = await scanDocument(file, docType, landUnit);
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

  const startLiveCamera = async () => {
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // Request autofocus for document scanning
            focusMode: 'continuous',
            advanced: [{ focusMode: 'continuous' }]
          }
        });
      } catch (e) {
        console.warn("Environment/autofocus not available, falling back:", e);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
      }

      // Try to apply continuous autofocus on the video track after stream starts
      try {
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const caps = videoTrack.getCapabilities();
          if (caps.focusMode && caps.focusMode.includes('continuous')) {
            await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
          }
        }
      } catch (focusErr) {
        console.warn('Autofocus apply failed (normal for most webcams):', focusErr);
      }

      // Store in ref FIRST so videoCallbackRef can access it when <video> mounts
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setShowLiveCamera(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setStream(null);
    setShowLiveCamera(false);
  };


  // Callback ref: fires the instant <video> mounts into DOM — zero timing issues
  const videoCallbackRef = React.useCallback((videoEl) => {
    liveVideoRef.current = videoEl;
    if (videoEl && streamRef.current) {
      videoEl.srcObject = streamRef.current;
      videoEl.play().catch(e => console.warn('Autoplay prevented:', e));
    }
  }, []);

  const captureFrame = () => {
    const video = liveVideoRef.current;
    if (video && canvasRef.current && video.videoWidth > 0) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
        stopLiveCamera();
      }, 'image/jpeg', 0.95);
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
          <Upload size={18} style={{ color: 'var(--accent-indigo)' }} />
          Fast Fill via Document Scan (Optional)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Upload your 7/12 extract or ID card. Our AI will automatically extract your name, state, and land holding securely.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file && !showLiveCamera ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ marginBottom: error ? '12px' : '0' }}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef} type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.pdf,.webp,.heic,.heif"
              onChange={handleChange} style={{ display: 'none' }} 
            />
            <input
              ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleChange} style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); checkConsent(() => fileInputRef.current?.click()); }}
                style={{
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FileImage size={24} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gallery</span>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); checkConsent(() => startLiveCamera()); }}
                style={{
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                  background: 'var(--gradient-primary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)',
                  cursor: 'pointer'
                }}
              >
                <Camera size={24} style={{ color: 'white' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>Live Camera</span>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); checkConsent(() => cameraInputRef.current?.click()); }}
                style={{
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={24} style={{ color: 'var(--accent-indigo)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Native Cam</span>
              </motion.div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
              Tap on an option to provide your document.
            </p>
          </motion.div>
        ) : showLiveCamera ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'relative', borderRadius: '14px', overflow: 'hidden',
              background: '#000', border: '1px solid var(--border-glass)',
              aspectRatio: '16/9'
            }}
          >
            <style>{`
              @keyframes scanline {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>

            <video
              ref={videoCallbackRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Glowing Scanning Overlay Frame & Prompts */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              {/* Header prompt instruction */}
              <div style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '10px 16px',
                textAlign: 'center',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                📸 <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>Capturing...</span>&nbsp; Hold card <span style={{ color: '#fbbf24', fontWeight: 800 }}>30–50 cm away</span> and keep it flat &amp; steady within the green frame.
              </div>

              {/* Central Glowing Scanner box */}
              <div style={{
                width: '75%',
                height: '55%',
                border: '2px dashed var(--accent-emerald)',
                borderRadius: '12px',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.35), inset 0 0 20px rgba(16, 185, 129, 0.15)',
                position: 'relative'
              }}>
                {/* 4 Corner Markers */}
                <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '24px', height: '24px', borderTop: '4px solid var(--accent-emerald)', borderLeft: '4px solid var(--accent-emerald)', borderRadius: '4px 0 0 0' }}></div>
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '24px', height: '24px', borderTop: '4px solid var(--accent-emerald)', borderRight: '4px solid var(--accent-emerald)', borderRadius: '0 4px 0 0' }}></div>
                <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '24px', height: '24px', borderBottom: '4px solid var(--accent-emerald)', borderLeft: '4px solid var(--accent-emerald)', borderRadius: '0 0 0 4px' }}></div>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderBottom: '4px solid var(--accent-emerald)', borderRight: '4px solid var(--accent-emerald)', borderRadius: '0 0 4px 0' }}></div>

                {/* Horizontal Scanning line */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2.5px',
                  background: 'linear-gradient(90deg, transparent, var(--accent-emerald), transparent)',
                  boxShadow: '0 0 12px var(--accent-emerald)',
                  top: '0%',
                  animation: 'scanline 3s ease-in-out infinite'
                }}></div>
              </div>

              {/* Spacer for bottom controls */}
              <div style={{ height: '80px' }}></div>
            </div>

            {/* Interactive Buttons (Z-index high to overlap pointerEvents none overlay) */}
            <div style={{ position: 'absolute', inset: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', paddingBottom: '16px' }}>
                {/* Cancel red button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopLiveCamera}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem',
                    backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <X size={16} /> Cancel
                </motion.button>

                {/* Confirm & Consent Capture Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={captureFrame}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', background: 'var(--gradient-primary)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Camera size={16} /> I Give Consent
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
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
                style={{ fontSize: '0.9rem', padding: '8px 12px', width: '100%' }}
              >
                <option value="7/12 Land Record">7/12 Land Record (Satbara)</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Kisan Credit Card">Kisan Credit Card</option>
                <option value="Other Official ID">Other Official ID</option>
              </select>
            </div>

            {docType === '7/12 Land Record' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Land Unit on Document</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Hectares', 'Acres'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setLandUnit(unit)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: landUnit === unit ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                        color: landUnit === unit ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${landUnit === unit ? 'var(--accent-indigo)' : 'var(--border-glass)'}`
                      }}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-scanning feedback — no manual button needed */}
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: isScanning
                ? 'rgba(99,102,241,0.1)'
                : 'rgba(16,185,129,0.08)',
              border: `1px solid ${isScanning ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              {isScanning ? (
                <>
                  <Loader2 size={18} className="spin" style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>
                    AI Scanning in progress — extracting data securely...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                    Ready to scan — processing will begin automatically.
                  </span>
                </>
              )}
            </div>
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
