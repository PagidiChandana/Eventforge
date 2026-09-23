import React, { useState, useEffect, useCallback } from 'react';
import {
  listPlans, createPlan, updatePlan, deletePlan,
  listSubscriptions, getMySubscription, subscribe, setSubscriptionStatus
} from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import { CreditCard, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { ROLES } from '../constants/roles';

const inputStyle = {
  width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};

const emptyPlan = { name: '', price: 0, billingCycle: 'Monthly', maxEvents: 5, maxAttendeesPerEvent: 500, storageGB: 10, features: '' };

const STATUS_COLORS = { Active: '#34d399', Trialing: '#38bdf8', Expired: '#94a3b8', Cancelled: '#fb7185' };

export default function Subscriptions() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.PLATFORM_ADMIN;

  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pRes = await listPlans();
      setPlans(pRes.data || []);
      if (isAdmin) {
        const sRes = await listSubscriptions();
        setSubs(sRes.data || []);
      } else {
        const mRes = await getMySubscription();
        setMySubs(mRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setModalOpen(true); };
  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name || '', price: plan.price || 0, billingCycle: plan.billingCycle || 'Monthly',
      maxEvents: plan.limits?.maxEvents ?? 5,
      maxAttendeesPerEvent: plan.limits?.maxAttendeesPerEvent ?? 500,
      storageGB: plan.limits?.storageGB ?? 10,
      features: (plan.features || []).join(', ')
    });
    setModalOpen(true);
  };

  const toPayload = () => ({
    name: form.name,
    price: Number(form.price),
    billingCycle: form.billingCycle,
    limits: {
      maxEvents: Number(form.maxEvents),
      maxAttendeesPerEvent: Number(form.maxAttendeesPerEvent),
      storageGB: Number(form.storageGB)
    },
    features: String(form.features).split(',').map((f) => f.trim()).filter(Boolean)
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await updatePlan(editing._id, toPayload()); setSuccess(`Plan "${form.name}" updated`); }
      else { await createPlan(toPayload()); setSuccess(`Plan "${form.name}" created`); }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
    try { await deletePlan(plan._id); setSuccess(`Plan "${plan.name}" deleted`); fetchAll(); }
    catch (err) { setError(err.message || 'Failed to delete plan'); }
  };

  const handleSubscribe = async (plan) => {
    if (!window.confirm(`Subscribe "${user.organization}" to ${plan.name} ($${plan.price}/${plan.billingCycle})?`)) return;
    try { await subscribe(plan._id); setSuccess(`Subscribed to ${plan.name}`); fetchAll(); }
    catch (err) { setError(err.message || 'Subscription failed'); }
  };

  const handleStatus = async (sub, status) => {
    try { await setSubscriptionStatus(sub._id, status); setSuccess(`Subscription marked ${status}`); fetchAll(); }
    catch (err) { setError(err.message || 'Failed to update status'); }
  };

  if (loading) return <LoadingSpinner message="Loading subscription plans..." />;

  const activeOrg = mySubs.find((s) => ['Active', 'Trialing'].includes(s.status));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard style={{ width: '24px', height: '24px', color: '#818cf8' }} />
            {isAdmin ? 'Subscription Management' : 'Subscription Plans'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {isAdmin
              ? 'Create plans, track organization subscriptions, and manage status/expiry.'
              : `Plans for "${user.organization || 'your organization'}". Subscribing replaces any active plan.`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus style={{ width: '15px', height: '15px' }} /> New Plan
          </button>
        )}
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {!isAdmin && activeOrg && (
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #34d399' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Current plan</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>
            {activeOrg.plan?.name} <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLORS[activeOrg.status] }}>● {activeOrg.status}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {activeOrg.endDate ? `Renews/expires ${new Date(activeOrg.endDate).toLocaleDateString()}` : ''} · Limits: {activeOrg.plan?.limits?.maxEvents} events · {activeOrg.plan?.limits?.maxAttendeesPerEvent} attendees/event · {activeOrg.plan?.limits?.storageGB} GB
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {plans.map((plan) => (
          <div key={plan._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: plan.isActive ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{plan.name}</h3>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(plan)} title="Edit" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                    <Pencil style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button onClick={() => handleDelete(plan)} title="Delete" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              ${plan.price}<span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}> / {plan.billingCycle}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {plan.limits?.maxEvents} events · {plan.limits?.maxAttendeesPerEvent} attendees/event · {plan.limits?.storageGB} GB storage
            </div>
            {(plan.features || []).length > 0 && (
              <ul style={{ fontSize: '12px', color: '#cbd5e1', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
            {!plan.isActive && <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>INACTIVE</span>}
            {!isAdmin && plan.isActive && (
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={activeOrg?.plan?._id === plan._id}
                style={{
                  marginTop: '4px', backgroundColor: activeOrg?.plan?._id === plan._id ? 'rgba(16,185,129,0.12)' : '#6366f1',
                  color: activeOrg?.plan?._id === plan._id ? '#34d399' : '#fff', border: 'none', padding: '10px',
                  borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                  cursor: activeOrg?.plan?._id === plan._id ? 'default' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {activeOrg?.plan?._id === plan._id ? (<><Check style={{ width: '15px', height: '15px' }} /> Current Plan</>) : 'Subscribe'}
              </button>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>No subscription plans yet.</p>
        </div>
      )}

      {/* Admin: all organization subscriptions */}
      {isAdmin && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', padding: '18px 20px 0 20px' }}>Organization Subscriptions ({subs.length})</h2>
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(15,23,42,0.8)', textAlign: 'left' }}>
                  {['Organization', 'Plan', 'Status', 'Expiry', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s._id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fff' }}>{s.organization}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{s.plan?.name} (${s.plan?.price})</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '12px', color: STATUS_COLORS[s.status] || '#fff' }}>● {s.status}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={s.status}
                        onChange={(e) => handleStatus(s, e.target.value)}
                        style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {['Trialing', 'Active', 'Expired', 'Cancelled'].map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subs.length === 0 && <p style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No subscriptions yet.</p>}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Subscription Plan'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Plan name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} placeholder="Professional" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Price ($)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Billing cycle</label>
              <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }}>
                <option>Monthly</option><option>Yearly</option><option>One-time</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Max events</label>
              <input type="number" min="0" value={form.maxEvents} onChange={(e) => setForm({ ...form, maxEvents: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Attendees/event</label>
              <input type="number" min="0" value={form.maxAttendeesPerEvent} onChange={(e) => setForm({ ...form, maxAttendeesPerEvent: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Storage (GB)</label>
              <input type="number" min="0" value={form.storageGB} onChange={(e) => setForm({ ...form, storageGB: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Features (comma-separated)</label>
            <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} placeholder="AI content, Priority support, Custom branding" />
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
