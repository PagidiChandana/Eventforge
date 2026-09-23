import React, { useEffect, useState } from 'react';
import { getSponsorProfile, getDeliverablesBySponsor } from '../services/modulesService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { BarChart3 } from 'lucide-react';

// Sponsor → Analytics: package value, deliverable completion and event engagement summary.
export default function SponsorAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deliverables, setDeliverables] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const pRes = await getSponsorProfile();
        const prof = pRes.data;
        setProfile(prof);
        if (prof) {
          const dRes = await getDeliverablesBySponsor(prof._id).catch(() => null);
          setDeliverables(dRes?.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load sponsor analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading sponsor analytics..." />;

  const total = deliverables.length;
  const done = deliverables.filter((d) => ['Approved', 'Completed', 'Submitted'].includes(d.status)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const pkgs = [...new Map((deliverables || []).map((d) => d.package).filter(Boolean).map((p) => [p._id?.toString?.(), p])).values()];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 style={{ width: '24px', height: '24px', color: '#f472b6' }} /> Sponsorship Analytics
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          {profile?.companyName || 'Your company'} · package value, deliverable progress and engagement.
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Packages</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{pkgs.length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{pkgs.map((p) => p.name).join(', ') || 'None assigned'}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Deliverables Done</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{done}/{total}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{pct}% completion</div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Package Value</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f472b6', marginTop: '4px' }}>
            ${pkgs.reduce((n, p) => n + (p.price || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total sponsorship value</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '22px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Deliverable Breakdown</h2>
        {deliverables.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No deliverables tracked yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deliverables.map((d) => (
              <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{d.title || d.name}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', backgroundColor: 'rgba(99,102,241,0.12)', padding: '3px 10px', borderRadius: '20px' }}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
