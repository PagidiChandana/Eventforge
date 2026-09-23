import React, { useEffect, useState } from 'react';
import { getPolicy, updatePolicy } from '../services/policyService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Shield, Settings, Users, Save, CheckCircle2 } from 'lucide-react';

const AdminPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    registrationRules: {
      allowWaitlist: true,
      requireEmailVerification: false
    },
    securityPolicies: {
      passwordMinLength: 8,
      requireSpecialChar: true,
      maxLoginAttempts: 5
    },
    platformLimits: {
      maxEventsPerOrganizer: 50,
      maxAttendeesPerEvent: 5000,
      maxStorageMB: 1024
    }
  });

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await getPolicy();
      if (res.data) {
        setPolicy(res.data);
        setFormData({
          registrationRules: res.data.registrationRules || formData.registrationRules,
          securityPolicies: res.data.securityPolicies || formData.securityPolicies,
          platformLimits: res.data.platformLimits || formData.platformLimits
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch global policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await updatePolicy(formData);
      setPolicy(res.data);
      setSuccessMsg('Global policies updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update policies');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading global policies..." />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield style={{ color: '#8b5cf6' }} />
          Global Platform Policies
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '15px' }}>
          Configure platform-wide rules, limits, and security settings. These affect all users and events.
        </p>
      </div>

      {error && <AlertError message={error} />}
      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 style={{ width: '20px', height: '20px' }} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Registration Rules */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users style={{ width: '20px', height: '20px', color: '#3b82f6' }} /> Registration Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.registrationRules.allowWaitlist}
                onChange={e => setFormData({ ...formData, registrationRules: { ...formData.registrationRules, allowWaitlist: e.target.checked } })}
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
              />
              Allow waitlists for sold-out events platform-wide
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.registrationRules.requireEmailVerification}
                onChange={e => setFormData({ ...formData, registrationRules: { ...formData.registrationRules, requireEmailVerification: e.target.checked } })}
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
              />
              Require email verification for new attendee signups
            </label>
          </div>
        </div>

        {/* Security Policies */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield style={{ width: '20px', height: '20px', color: '#10b981' }} /> Security Policies
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Minimum Password Length</label>
              <input 
                type="number" 
                min="6" max="32" 
                value={formData.securityPolicies.passwordMinLength}
                onChange={e => setFormData({ ...formData, securityPolicies: { ...formData.securityPolicies, passwordMinLength: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Max Login Attempts</label>
              <input 
                type="number" 
                min="3" max="20" 
                value={formData.securityPolicies.maxLoginAttempts}
                onChange={e => setFormData({ ...formData, securityPolicies: { ...formData.securityPolicies, maxLoginAttempts: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.securityPolicies.requireSpecialChar}
                onChange={e => setFormData({ ...formData, securityPolicies: { ...formData.securityPolicies, requireSpecialChar: e.target.checked } })}
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
              />
              Require special characters in passwords
            </label>
          </div>
        </div>

        {/* Platform Limits */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings style={{ width: '20px', height: '20px', color: '#f59e0b' }} /> Platform Limits
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Max Events per Organizer</label>
              <input 
                type="number" 
                min="1" 
                value={formData.platformLimits.maxEventsPerOrganizer}
                onChange={e => setFormData({ ...formData, platformLimits: { ...formData.platformLimits, maxEventsPerOrganizer: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Max Attendees per Event</label>
              <input 
                type="number" 
                min="10" 
                value={formData.platformLimits.maxAttendeesPerEvent}
                onChange={e => setFormData({ ...formData, platformLimits: { ...formData.platformLimits, maxAttendeesPerEvent: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Max Storage per Org (MB)</label>
              <input 
                type="number" 
                min="100" 
                value={formData.platformLimits.maxStorageMB}
                onChange={e => setFormData({ ...formData, platformLimits: { ...formData.platformLimits, maxStorageMB: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 24px', borderRadius: '8px', 
              backgroundColor: '#8b5cf6', color: '#fff', 
              fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            <Save style={{ width: '18px', height: '18px' }} />
            {saving ? 'Saving...' : 'Save Global Policies'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPolicy;
