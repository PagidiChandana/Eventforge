import React, { useState, useEffect, useCallback } from 'react';
import { listUsers, setUserStatus, createUserByAdmin } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import { Users, Search, Shield, UserPlus } from 'lucide-react';
import { ROLES, ALL_ROLES } from '../constants/roles';

const ROLE_COLORS = {
  [ROLES.PLATFORM_ADMIN]: '#a5b4fc',
  [ROLES.EVENT_ORGANIZER]: '#38bdf8',
  [ROLES.EVENT_STAFF]: '#fbbf24',
  [ROLES.SPEAKER]: '#c084fc',
  [ROLES.SPONSOR]: '#f472b6',
  [ROLES.ATTENDEE]: '#34d399',
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === ROLES.PLATFORM_ADMIN;

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: ROLES.EVENT_ORGANIZER, organization: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ role: roleFilter || undefined, search: search || undefined, limit: 100 });
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (u) => {
    setError(null);
    setSuccess(null);
    try {
      await setUserStatus(u._id, !u.isActive);
      setSuccess(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  // Admin provisions organizer/staff/speaker/sponsor accounts (public signup is attendee-only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await createUserByAdmin(newUser);
      setSuccess(`Account created: ${res.data?.user?.email} (${res.data?.user?.role})`);
      setCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', role: ROLES.EVENT_ORGANIZER, organization: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const counts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <LoadingSpinner message="Loading user directory..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ width: '24px', height: '24px', color: '#818cf8' }} />
            {isAdmin ? 'All Users' : 'User Directory'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {total} registered across {Object.keys(counts).length} roles
            {Object.entries(counts).map(([r, c]) => ` · ${c} ${r}`).join('')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#64748b' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput.trim()); }}
              onBlur={() => setSearch(searchInput.trim())}
              placeholder="Search name, email, org…"
              style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '9px 12px 9px 34px', fontSize: '13px', outline: 'none', width: '220px' }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {isAdmin && (
            <button
              onClick={() => setCreateOpen(true)}
              style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <UserPlus style={{ width: '15px', height: '15px' }} /> Add User
            </button>
          )}
        </div>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(15,23,42,0.8)', textAlign: 'left' }}>
                {['User', 'Role', 'Organization', 'Status', isAdmin ? 'Action' : null].filter(Boolean).map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: ROLE_COLORS[u.role] || '#e2e8f0', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                      <Shield style={{ width: '12px', height: '12px' }} />{u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.organization || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: u.isActive ? '#34d399' : '#fb7185' }}>
                      {u.isActive ? '● Active' : '● Deactivated'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u._id === currentUser?._id || u.email === 'admin@eventforge.com'}
                        title={u._id === currentUser?._id ? 'You cannot deactivate yourself' : u.isActive ? 'Deactivate account' : 'Activate account'}
                        style={{
                          backgroundColor: u.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          border: `1px solid ${u.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          color: u.isActive ? '#f87171' : '#34d399',
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                          cursor: (u._id === currentUser?._id) ? 'not-allowed' : 'pointer',
                          opacity: (u._id === currentUser?._id) ? 0.4 : 1
                        }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No users match this filter.</p>
          )}
        </div>
      </div>

      {/* Admin provisions organizer/staff/speaker/sponsor accounts */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add User Account">
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Full Name *</label>
              <input required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} placeholder="Jane Doe" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Email *</label>
              <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} placeholder="jane@company.com" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Temporary Password *</label>
              <input required type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} placeholder="Min 6 characters" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Role *</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }}>
                {[ROLES.EVENT_ORGANIZER, ROLES.EVENT_STAFF, ROLES.SPEAKER, ROLES.SPONSOR, ROLES.ATTENDEE].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Organization</label>
            <input value={newUser.organization} onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} placeholder="Acme Corp" />
          </div>
          <button type="submit" disabled={creating} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
            {creating ? 'Creating…' : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
