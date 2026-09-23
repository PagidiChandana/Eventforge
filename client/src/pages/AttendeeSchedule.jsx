import React, { useEffect, useState, useMemo } from 'react';
import { getMyRegistrations, updateSelectedSessions } from '../services/registrationService';
import { getSessionsByEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Clock, Plus, X, Search, AlertTriangle } from 'lucide-react';

const overlaps = (a, b) =>
  new Date(a.startTime) < new Date(b.endTime) && new Date(b.startTime) < new Date(a.endTime);

export default function AttendeeSchedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [topicFilter, setTopicFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRegs = async () => {
    setLoading(true);
    try {
      const res = await getMyRegistrations();
      const regs = (res.data || []).filter((r) => r.status === 'Approved');
      setRegistrations(regs);
      if (regs.length > 0 && !selectedEventId) {
        setSelectedEventId(regs[0].event?._id || regs[0].event);
      }
    } catch (err) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRegs(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    const loadSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await getSessionsByEvent(selectedEventId);
        setSessions(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load sessions');
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, [selectedEventId]);

  const activeReg = useMemo(
    () => registrations.find((r) => (r.event?._id || r.event)?.toString() === selectedEventId?.toString()),
    [registrations, selectedEventId]
  );

  const selectedIds = useMemo(
    () => new Set((activeReg?.selectedSessions || []).map((s) => (s._id || s).toString())),
    [activeReg]
  );

  const topics = useMemo(
    () => [...new Set(sessions.map((s) => s.category || s.sessionType || 'General'))],
    [sessions]
  );

  const visibleSessions = topicFilter
    ? sessions.filter((s) => (s.category || s.sessionType || 'General') === topicFilter)
    : sessions;

  const mySchedule = useMemo(
    () => sessions.filter((s) => selectedIds.has(s._id.toString()))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [sessions, selectedIds]
  );

  const toggleSession = async (session) => {
    setError(null);
    setSuccess(null);
    const id = session._id.toString();
    let next;
    if (selectedIds.has(id)) {
      next = [...selectedIds].filter((x) => x !== id);
    } else {
      // Client-side conflict check first
      const clash = mySchedule.find((s) => overlaps(s, session));
      if (clash) {
        setError(`Schedule Conflict: "${session.title}" overlaps with "${clash.title}".`);
        return;
      }
      next = [...selectedIds, id];
    }
    setSaving(true);
    try {
      const res = await updateSelectedSessions(activeReg._id, next);
      setRegistrations((prev) => prev.map((r) =>
        r._id === activeReg._id ? { ...r, selectedSessions: res.data?.selectedSessions || next } : r
      ));
      setSuccess(selectedIds.has(id) ? 'Session removed from your schedule.' : 'Session added to your schedule.');
    } catch (err) {
      setError(err.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your schedule..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ width: '24px', height: '24px', color: '#38bdf8' }} /> My Schedule
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {mySchedule.length} session{mySchedule.length === 1 ? '' : 's'} selected. Overlapping sessions are blocked.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {registrations.map((r) => (
              <option key={r._id} value={r.event?._id || r.event}>{r.event?.name || 'Event'}</option>
            ))}
          </select>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: error.startsWith('Schedule Conflict') ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${error.startsWith('Schedule Conflict') ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`, color: error.startsWith('Schedule Conflict') ? '#fcd34d' : '#fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} /> {error}
        </div>
      )}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Register for an event first, then build your session schedule here.</p>
        </div>
      ) : loadingSessions ? (
        <LoadingSpinner message="Loading sessions..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {visibleSessions.map((s) => {
            const selected = selectedIds.has(s._id.toString());
            const clash = !selected && mySchedule.find((x) => overlaps(x, s));
            return (
              <div key={s._id} className="glass-card" style={{ padding: '18px', borderColor: selected ? 'rgba(56,189,248,0.5)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{s.title}</h3>
                  {selected && <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.12)', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>SELECTED</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>🎤 {(s.speakers || []).map((sp) => sp.name || sp).join(', ') || 'TBA'}</span>
                  <span>📍 {s.roomName || 'TBA'} · 🕒 {s.startTime ? new Date(s.startTime).toLocaleString() : ''}</span>
                  <span>🏷️ {s.category || s.sessionType || 'General'}</span>
                </div>
                {s.description && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>{s.description.slice(0, 140)}{s.description.length > 140 ? '…' : ''}</p>}
                {clash && <p style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, marginTop: '8px' }}>⚠️ Overlaps "{clash.title}"</p>}
                <button
                  onClick={() => toggleSession(s)}
                  disabled={saving}
                  style={{
                    marginTop: '12px', width: '100%',
                    backgroundColor: selected ? 'rgba(239,68,68,0.1)' : clash ? 'rgba(100,116,139,0.2)' : '#6366f1',
                    border: `1px solid ${selected ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                    color: selected ? '#f87171' : clash ? '#94a3b8' : '#fff',
                    padding: '9px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  {selected ? (<><X style={{ width: '14px', height: '14px' }} /> Remove</>) : (<><Plus style={{ width: '14px', height: '14px' }} /> Select Session</>)}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {visibleSessions.length === 0 && registrations.length > 0 && !loadingSessions && (
        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}><Search style={{ width: '14px', height: '14px', display: 'inline' }} /> No sessions match this topic filter.</p>
      )}
    </div>
  );
}
