import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader2, Shield, Calendar, Mail, User } from 'lucide-react';
import { getAllUsers } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();
  const { t } = useTranslation();

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

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <Users size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
          {t('us_title', 'User Management')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('us_subtitle', 'View all registered users and administrators across the platform')}
        </p>
      </motion.div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
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
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ background: 'var(--bg-card)', borderRadius: '12px' }}
                  >
                    <td style={{ ...tdStyle, borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role === 'admin' ? t('role_admin', 'Administrator') : t('role_farmer', 'Farmer')}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, borderRadius: '0 12px 12px 0' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(10px)',
};
