import React, { useState, useEffect, useCallback } from 'react';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};

const emptyForm = { name: '', description: '', website: '', logo: '' };

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrganizations();
      setOrgs(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (org) => {
    setEditing(org);
    setForm({ name: org.name || '', description: org.description || '', website: org.website || '', logo: org.logo || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateOrganization(editing._id, form);
        setSuccess(`"${form.name}" updated`);
      } else {
        await createOrganization(form);
        setSuccess(`"${form.name}" created`);
      }
      setModalOpen(false);
      fetchOrgs();
    } catch (err) {
      setError(err.message || 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (org) => {
    if (!window.confirm(`Suspend/delete "${org.name}"? This removes it from the platform.`)) return;
    try {
      await deleteOrganization(org._id);
      setSuccess(`"${org.name}" removed`);
      fetchOrgs();
    } catch (err) {
      setError(err.message || 'Failed to delete organization');
    }
  };

  if (loading) return <LoadingSpinner message="Loading organizations..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ width: '24px', height: '24px', color: '#818cf8' }} />
            Organizations
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>{orgs.length} organizations on the platform</p>
        </div>
        <button
          onClick={openCreate}
          style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus style={{ width: '15px', height: '15px' }} /> Add Organization
        </button>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {orgs.map((org) => (
          <div key={org._id} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{org.name}</h3>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => openEdit(org)} title="Edit" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <Pencil style={{ width: '14px', height: '14px' }} />
                </button>
                <button onClick={() => handleDelete(org)} title="Delete" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
            {org.description && <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>{org.description}</p>}
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
              {org.website && <div>🌐 {org.website}</div>}
              {org.owner && <div>Owner: {org.owner.name} ({org.owner.email})</div>}
            </div>
          </div>
        ))}
      </div>

      {orgs.length === 0 && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>No organizations yet. Add the first one to get started.</p>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Organization' : 'Add Organization'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} placeholder="Acme Conferences" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, marginTop: '6px', minHeight: '70px', resize: 'vertical' }} placeholder="What this organization hosts…" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} placeholder="https://…" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Logo URL</label>
            <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} style={{ ...inputStyle, marginTop: '6px' }} placeholder="https://…/logo.png" />
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Organization'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
