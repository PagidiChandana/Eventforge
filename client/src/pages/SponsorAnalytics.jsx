import React, { useEffect, useState } from 'react';
import { getSponsorProfile, getDeliverablesBySponsor } from '../services/modulesService';
import { getMyAnalytics } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { BarChart3 } from 'lucide-react';

// Sponsor → Analytics: package value, deliverable completion and event engagement summary.
export default function SponsorAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, analyticsRes] = await Promise.all([getSponsorProfile(), getMyAnalytics()]);
        const prof = pRes.data;
        setProfile(prof);
        setAnalytics(analyticsRes.data || null);
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

  const total = analytics?.deliverableCount || 0;
  const statuses = analytics?.deliverables || {};
  const done = (statuses.Approved || 0) + (statuses.Completed || 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

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
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{analytics?.packageCount || 0}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{(analytics?.events || []).map((event) => event.package?.name).filter(Boolean).join(', ') || 'None assigned'}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Deliverables Done</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{done}/{total}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{pct}% completion</div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Package Value</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f472b6', marginTop: '4px' }}>
            ${(analytics?.packageValue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total sponsorship value</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '22px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Deliverable Breakdown</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {['Pending', 'In Progress', 'Submitted', 'Approved', 'Rejected'].map((status) => <span key={status} style={{ color: '#cbd5e1', background: 'rgba(15,23,42,.7)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}>{status}: {statuses[status] || 0}</span>)}
        </div>
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

      <div className="glass-panel" style={{ padding: '22px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Sponsored events</h2>
        {(analytics?.events || []).length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>No event sponsorships assigned yet.</p> : (analytics.events || []).map((event, index) => <div key={`${event._id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.06)', color: '#cbd5e1', fontSize: '13px' }}><span>{event.name || 'Event'}</span><span>{event.package?.name || 'No package'} · {event.status || ''}</span></div>)}
      </div>
    </div>
  );
}
