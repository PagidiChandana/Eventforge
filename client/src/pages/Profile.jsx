import React, { useState } from 'react';
import { User, Mail, Shield, Building, Award, Calendar, Zap, Save, Lock, Phone, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlertError from '../components/AlertError';

const inputStyle = {
  width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};
const labelStyle = { fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', display: 'block' };

// My Profile = User ACCOUNT profile only (name, email, phone, password, photo, prefs).
// Role-specific data lives in its own module:
// Speaker Hub, Sponsor Portal, organization settings — never edited here.
const Profile = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  if (!user) return null;

  const startEdit = () => {
    setForm({
      name: user.name || '',
      organization: user.organization || '',
      phoneNumber: user.profileInfo?.phoneNumber || '',
      title: user.profileInfo?.title || '',
      avatarUrl: user.profileInfo?.avatarUrl || '',
      interests: (user.profileInfo?.interests || []).join(', ')
    });
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    const fresh = res.data?.data?.user;
    if (fresh) {
      localStorage.setItem('ef_user', JSON.stringify(fresh));
      window.location.reload();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put('/auth/me', {
        name: form.name,
        organization: form.organization,
        profileInfo: {
          phoneNumber: form.phoneNumber,
          title: form.title,
          avatarUrl: form.avatarUrl,
          interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean)
        }
      });
      setSuccess('Account profile updated.');
      setEditing(false);
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setError('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/me/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setSuccess('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const interests = user.profileInfo?.interests || [];
  const title = user.profileInfo?.title || '';
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>My Profile</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Your account information and preferences
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px', marginBottom: '24px'
        }}>
          {user.profileInfo?.avatarUrl ? (
            <img src={user.profileInfo.avatarUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '28px', fontWeight: 800, flexShrink: 0,
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)'
            }}>
              {initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{user.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}>
                <Shield style={{ width: '13px', height: '13px' }} />
                {user.role}
              </span>
              {user.organization && (
                <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
                  {user.organization}
                </span>
              )}
            </div>
            {(title || user.profileInfo?.bio) && (
              <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '10px', lineHeight: '1.5' }}>
                {title || user.profileInfo.bio}
              </p>
            )}
          </div>

          {!editing && (
            <button onClick={startEdit} style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Organization</label>
                <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} style={inputStyle} placeholder="+1 555 0100" />
              </div>
              <div>
                <label style={labelStyle}>Job Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Software Architect" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Profile Photo URL</label>
              <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} style={inputStyle} placeholder="https://…/photo.jpg" />
            </div>
            <div>
              <label style={labelStyle}>Interests (comma-separated)</label>
              <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} style={inputStyle} placeholder="AI, Cloud, Security" />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditing(false)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                <Save style={{ width: '15px', height: '15px' }} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  <Mail style={{ width: '15px', height: '15px', color: '#6366f1' }} />
                  Email Address
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>{user.email}</div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  <Calendar style={{ width: '15px', height: '15px', color: '#10b981' }} />
                  Member Since
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>{joinDate}</div>
              </div>

              {user.profileInfo?.phoneNumber && (
                <div className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    <Phone style={{ width: '15px', height: '15px', color: '#06b6d4' }} />
                    Phone
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>{user.profileInfo.phoneNumber}</div>
                </div>
              )}

              <div className="glass-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  <Zap style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                  Account Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>Active</span>
                </div>
              </div>
            </div>

            {interests.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Award style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                  Interests & Topics
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {interests.map((interest, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      padding: '5px 14px', borderRadius: '20px',
                      fontSize: '13px', color: '#a5b4fc', fontWeight: 500
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Password change (account-level, separate from role modules) */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Lock style={{ width: '17px', height: '17px', color: '#f59e0b' }} /> Change Password
        </h3>
        <form onSubmit={handlePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" required value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New</label>
            <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} style={inputStyle} />
          </div>
          <button type="submit" disabled={pwSaving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.7 : 1 }}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Role module shortcut (separation notice) */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Link2 style={{ width: '16px', height: '16px', color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
          Role-specific details (Speaker Hub profile, Sponsor Portal brand assets, organization settings)
          are managed in their own dedicated modules — never mixed into this account profile.
        </p>
      </div>
    </div>
  );
};

export default Profile;
