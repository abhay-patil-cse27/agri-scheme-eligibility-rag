import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader2, Shield, Calendar, Mail, User, Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { getAllUsers, deleteUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), t('us_error_fetch', 'Failed to fetch users'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(userToDelete._id);
      if (res.success) {
        addToast(t('us_deleted_title', 'User Deleted'), t('us_deleted_desc', 'The account has been removed from the directory.'), 'success');
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setUserToDelete(null);
      } else {
        addToast(t('us_error_title', 'Error'), res.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), 'A system error occurred during deletion', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '32px', marginBottom: '24px' }}
        padding="32px"
      >
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              <Users size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
              {t('us_title', 'User Management')}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {t('us_subtitle', 'View all registered users and administrators across the platform')}
            </p>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Development Phase</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('us_search_ph', 'Search users by name, email or role...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: '44px', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-info">{filteredUsers.length} {t('us_total_users', 'Users')}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent-indigo)' }} />
            <p>{t('us_loading', 'Loading users...')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px', color: 'var(--text-primary)' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{t('us_no_results', 'No users found')}</p>
            <p style={{ fontSize: '0.9rem' }}>{t('us_no_results_desc', 'Try adjusting your search filters')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('us_col_user', 'User')}</th>
                  <th style={thStyle}>{t('us_col_role', 'Role')}</th>
                  <th style={thStyle}>{t('us_col_joined', 'Joined Date')}</th>
                  <th style={thStyle}>{t('us_col_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <motion.tr 
                    key={u._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ background: 'var(--bg-card)', borderRadius: '12px' }}
                  >
                    <td style={{ ...tdStyle, borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={12} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {u.role === 'admin' ? t('role_admin', 'Administrator') : t('role_farmer', 'Farmer')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(u.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-IN' : (i18n.language === 'hi' ? 'hi-IN' : 'mr-IN'), {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                      {u.role !== 'admin' && (
                        <motion.button
                          whileHover={{ scale: 1.1, color: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setUserToDelete(u)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AgriCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setUserToDelete(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#ef4444' }}>
                  <AlertTriangle size={32} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Dangerous Action: Delete Account
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                  You are about to permanently remove <strong>{userToDelete.name}</strong> ({userToDelete.email}) from the Niti-Setu platform.
                </p>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '20px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} /> Privacy & Compliance Notice
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>This action is IRREVERSIBLE and removes all associated profile data.</li>
                    <li>Pursuant to <strong>IT Act (2000)</strong> and Data Protection standards, account removal must be intentional and authorized.</li>
                    <li><em>Feature Note:</em> This administrative control is currently in <strong>Beta / Development Phase</strong>.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                  <button
                    disabled={isDeleting}
                    onClick={() => setUserToDelete(null)}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDeleteUser}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Confirm Delete</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0 16px 8px 16px',
  color: 'var(--text-muted)',
  fontWeight: 500,
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  borderTop: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
};
