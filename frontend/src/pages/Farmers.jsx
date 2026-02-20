import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, Edit2, Loader2, MapPin, Ruler, Search, User, Droplets, Wallet, Sprout, Shield, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getProfiles, deleteProfile, updateProfile } from '../services/api';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', ' त्रिपुरा', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function Farmers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [editingProfile, setEditingProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await getProfiles();
      if (res.success) {
        setProfiles(res.data);
      } else {
        setError(res.error || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${name}?`)) return;
    try {
      setLoading(true);
      await deleteProfile(id);
      await fetchProfiles();
    } catch (err) {
      alert("Failed to delete: " + err.message);
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editingProfile };
      payload.age = parseInt(payload.age) || null;
      payload.landHolding = parseFloat(payload.landHolding) || 0;
      payload.annualIncome = parseInt(payload.annualIncome) || 0;
      
      await updateProfile(editingProfile._id, payload);
      setEditingProfile(null);
      await fetchProfiles();
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filtered = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            <Users size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-violet)' }} />
            Farmer <span className="gradient-text">Profiles</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Manage extracted farmer data and scheme beneficiaries
          </p>
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search farmers or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark"
            style={{ paddingLeft: '44px', borderRadius: '20px' }}
          />
        </div>
      </motion.div>

      {error ? (
        <div style={{ padding: '20px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '12px' }}>
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          {error}
        </div>
      ) : loading && profiles.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--accent-indigo)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No profiles found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filtered.map((profile, i) => (
            <motion.div
              key={profile._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.name || "Unknown Farmer"}
                  </h3>
                  {profile.age && <span className="badge badge-info">{profile.age} yrs</span>}
                  <span className="badge badge-success">{profile.category}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {profile.district ? `${profile.district}, ` : ''}{profile.state}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Ruler size={14} /> {profile.landHolding} acres
                  </span>
                  {profile.cropType && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sprout size={14} /> {profile.cropType}
                    </span>
                  )}
                  {profile.annualIncome > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wallet size={14} /> ₹{profile.annualIncome.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingProfile(profile)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-indigo)', width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Edit2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(profile._id, profile.name)}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                    color: 'var(--accent-rose)', width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !saving && setEditingProfile(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '90%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <button
                onClick={() => !saving && setEditingProfile(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} style={{ color: 'var(--accent-indigo)' }} />
                Edit Farmer Profile
              </h2>
              
              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><User size={14} /> Full Name</label>
                    <input name="name" value={editingProfile.name || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><User size={14} /> Age</label>
                    <input name="age" type="number" value={editingProfile.age || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> State</label>
                    <select name="state" value={editingProfile.state || ''} onChange={handleChange} className="select-dark" required>
                      <option value="">Select state</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> District</label>
                    <input name="district" value={editingProfile.district || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div>
                    <label style={labelStyle}><Ruler size={14} /> Land (acres)</label>
                    <input name="landHolding" type="number" step="0.1" value={editingProfile.landHolding || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><Sprout size={14} /> Crop Type</label>
                    <input name="cropType" value={editingProfile.cropType || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div>
                    <label style={labelStyle}><Shield size={14} /> Category</label>
                    <select name="category" value={editingProfile.category || 'General'} onChange={handleChange} className="select-dark">
                      <option value="General">General</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="OBC">OBC</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Wallet size={14} /> Annual Income (₹)</label>
                    <input name="annualIncome" type="number" value={editingProfile.annualIncome || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="hasIrrigationAccess" checked={editingProfile.hasIrrigationAccess || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <Droplets size={14} /> Has Irrigation
                    </label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                  <button type="button" onClick={() => setEditingProfile(null)} disabled={saving} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-glow" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: '8px',
};
