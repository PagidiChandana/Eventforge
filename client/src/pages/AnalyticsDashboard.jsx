import React, { useState, useEffect, useCallback } from 'react';
import { getOrganizerOverview, getEventAnalytics } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { BarChart3, TrendingUp, Users, CheckCircle, Star, Briefcase, Calendar, Award, RefreshCw } from 'lucide-react';

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

const MetricCard = ({ label, value, sub, subColor, icon, valueColor }) => (
  <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
      <h3 style={{ fontSize: '26px', fontWeight: 800, color: valueColor || '#fff', marginTop: '6px' }}>{value}</h3>
      {sub && <p style={{ fontSize: '11px', color: subColor || '#64748b', marginTop: '4px' }}>{sub}</p>}
    </div>
    <div style={{ color: valueColor || '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '10px', flexShrink: 0 }}>
      {icon}
    </div>
  </div>
);

const ProgressBar = ({ percent, color }) => (
  <div style={{ width: '100%', backgroundColor: '#1e293b', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
    <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color, height: '100%', borderRadius: '999px', transition: 'width 0.4s' }} />
  </div>
);

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventAnalytics, setEventAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingEvent, setFetchingEvent] = useState(false);
  const [error, setError] = useState(null);
  const [eventError, setEventError] = useState(null);

  const isAdmin = user?.role === 'Platform Admin';

  const fetchEventStats = useCallback(async (eventId) => {
    if (!eventId) return;
    setFetchingEvent(true);
    setEventError(null);
    try {
      const res = await getEventAnalytics(eventId);
      if (res && res.data) setEventAnalytics(res.data);
    } catch (err) {
      setEventError(err.message || 'Failed to load detailed event analytics');
      setEventAnalytics(null);
    } finally {
      setFetchingEvent(false);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrganizerOverview();
      const data = res?.data || null;
      setOverview(data);
      const list = data?.eventsSummary || [];
      if (list.length > 0) {
        const firstId = list[0]._id;
        setSelectedEventId((prev) => prev || firstId);
        fetchEventStats(list[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics overview');
    } finally {
      setLoading(false);
    }
  }, [fetchEventStats]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleEventChange = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    fetchEventStats(id);
  };

  if (loading) return <LoadingSpinner message="Aggregating real-time event analytics..." />;
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AlertError message={error} onClose={() => setError(null)} />
        <button
          onClick={fetchOverview}
          style={{ alignSelf: 'flex-start', backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Retry Analytics
        </button>
      </div>
    );
  }

  const events = overview?.eventsSummary || [];
  const evStats = eventAnalytics || {};
  const regs = evStats.registrations || {};
  const att = evStats.attendance || {};
  const fb = evStats.feedback || {};
  const sp = evStats.sponsors || {};
  const sessInfo = evStats.sessions || {};

  const regTotal = num(regs.total);
  const pct = (v) => (regTotal > 0 ? Math.round((num(v) / regTotal) * 100) : 0);

  const ratingDist = fb.distribution || {};
  const totalResponses = num(fb.totalResponses);
  const avgRating = Number(fb.avgRating || 0).toFixed(1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 style={{ width: '24px', height: '24px', color: '#818cf8' }} />
            {isAdmin ? 'Platform Analytics' : 'Organizer Analytics'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {isAdmin
              ? 'Platform-wide registrations, check-ins, session fill rates, ratings and sponsor deliverables.'
              : 'Real-time reporting for your events: registrations, check-ins, session capacity, ratings and sponsors.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {events.length > 0 && (
            <>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Event:
              </label>
              <select
                value={selectedEventId}
                onChange={handleEventChange}
                style={{ backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer', maxWidth: '280px' }}
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name} ({ev.status})
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            onClick={() => { fetchOverview(); }}
            title="Refresh analytics"
            style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
          >
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Macro overview */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <MetricCard label="Total Events" value={num(overview.totalEvents)} sub={`${num(overview.upcomingEvents)} Upcoming`} subColor="#818cf8" valueColor="#fff" icon={<Calendar style={{ width: '22px', height: '22px' }} />} />
          <MetricCard label="Active Registrations" value={num(overview.activeRegistrations)} sub="Approved delegates" valueColor="#34d399" icon={<Users style={{ width: '22px', height: '22px' }} />} />
          <MetricCard label="Checked-In" value={num(overview.totalCheckedIn)} sub="Scanned QR tickets" valueColor="#38bdf8" icon={<CheckCircle style={{ width: '22px', height: '22px' }} />} />
          <MetricCard label="Pending Tasks" value={num(overview.pendingTasks)} sub="Regs & deliverables" valueColor="#fbbf24" icon={<TrendingUp style={{ width: '22px', height: '22px' }} />} />
        </div>
      )}

      {/* No events state */}
      {events.length === 0 && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>No events to analyze yet</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Create and publish an event to see registration and attendance analytics here.</p>
        </div>
      )}

      {/* Per-event detail */}
      {events.length > 0 && (
        <div>
          {fetchingEvent && <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 4px' }}>Updating event metrics…</p>}
          {eventError && <div style={{ marginBottom: '12px' }}><AlertError message={eventError} onClose={() => setEventError(null)} /></div>}

          {!fetchingEvent && !eventError && eventAnalytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Registrations */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Users style={{ width: '17px', height: '17px', color: '#818cf8' }} /> Registrations
                </h3>
                {[
                  { label: 'Approved', value: num(regs.approved), color: '#34d399' },
                  { label: 'Pending approval', value: num(regs.pending), color: '#fbbf24' },
                  { label: 'Waitlisted', value: num(regs.waitlisted), color: '#a78bfa' },
                  { label: 'Cancelled', value: num(regs.cancelled), color: '#fb7185' },
                ].map((row) => (
                  <div key={row.label} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                      <span>{row.label}</span>
                      <span style={{ fontWeight: 700, color: row.color }}>{row.value} ({pct(row.value)}%)</span>
                    </div>
                    <ProgressBar percent={pct(row.value)} color={row.color} />
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                  <span>Total revenue</span>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>${num(regs.totalRevenue)}</span>
                </div>
              </div>

              {/* Attendance */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle style={{ width: '17px', height: '17px', color: '#38bdf8' }} /> Attendance & Check-In
                </h3>
                <div style={{ textAlign: 'center', padding: '8px 0 16px 0' }}>
                  <div style={{ fontSize: '34px', fontWeight: 800, color: '#38bdf8' }}>{num(att.checkInPercentage)}%</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Check-in completion rate</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: '#94a3b8' }}>Checked-in</p>
                    <p style={{ fontWeight: 800, color: '#fff', fontSize: '18px', marginTop: '4px' }}>{num(att.totalCheckedIn)}</p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: '#94a3b8' }}>No-shows</p>
                    <p style={{ fontWeight: 800, color: '#fb7185', fontSize: '18px', marginTop: '4px' }}>{num(att.noShowCount)}</p>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Star style={{ width: '17px', height: '17px', color: '#fbbf24' }} /> Attendee Feedback
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0 14px 0' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24' }}>{avgRating}</span>
                  <div>
                    <div style={{ color: '#fbbf24', fontSize: '15px' }}>{'★'.repeat(Math.round(Number(fb.avgRating || 0)))}{'☆'.repeat(5 - Math.round(Number(fb.avgRating || 0)))}</div>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>{totalResponses} reviews</p>
                  </div>
                </div>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = num(ratingDist[star]);
                  const w = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginBottom: '7px' }}>
                      <span style={{ width: '44px', color: '#94a3b8' }}>{star} ★</span>
                      <div style={{ flex: 1 }}><ProgressBar percent={w} color="#fbbf24" /></div>
                      <span style={{ width: '22px', textAlign: 'right', fontWeight: 700, color: '#cbd5e1' }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Sessions */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Award style={{ width: '17px', height: '17px', color: '#fbbf24' }} /> Popular Sessions
                </h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>{num(sessInfo.totalSessions)} total sessions</p>
                {(sessInfo.mostPopular || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(sessInfo.mostPopular || []).slice(0, 5).map((s) => (
                      <div key={s._id} style={{ backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                          <span style={{ fontWeight: 800, color: '#34d399', flexShrink: 0 }}>{num(s.utilization)}%</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{num(s.attended)} / {num(s.capacity)} seats · {s.track || 'General'}</div>
                        <div style={{ marginTop: '6px' }}><ProgressBar percent={num(s.utilization)} color="#34d399" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8', padding: '12px 0' }}>No session attendance recorded yet.</p>
                )}
              </div>

              {/* Sponsors */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Briefcase style={{ width: '17px', height: '17px', color: '#818cf8' }} /> Sponsor Deliverables
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                  <span>Completion</span>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>{num(sp.deliverables?.completionRate)}%</span>
                </div>
                <ProgressBar percent={num(sp.deliverables?.completionRate)} color="#34d399" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '12px', marginTop: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Sponsors</p>
                    <p style={{ fontWeight: 800, color: '#fff', fontSize: '18px', marginTop: '4px' }}>{num(sp.sponsorsCount)}</p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Packages</p>
                    <p style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '18px', marginTop: '4px' }}>{num(sp.packagesCount)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
