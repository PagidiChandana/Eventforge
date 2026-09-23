import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getOrganizerSpeakers, createSpeakerForOrganizer,
  assignSpeakerToSession, removeSpeakerFromSession
} from '../services/modulesService';
import { getEvents, getSessionsByEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import { Mic2, Plus, UserX } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};
const labelStyle = { fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', display: 'block' };

// Organizer → Speaker Management (assignment-level ONLY).
// This page never opens or edits a speaker's personal Speaker Hub profile.
export default function OrganizerSpeakers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSpeakerIds, setExpandedSpeakerIds] = useState(() => new Set());
  const [newSpeaker, setNewSpeaker] = useState({ name: '', designation: '', company: '', contactEmail: '', expertise: '' });
  const [assign, setAssign] = useState({ eventId: '', sessionId: '', speakerId: '' });

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, eRes] = await Promise.all([
        getOrganizerSpeakers().catch(() => null),
        getEvents({ myEvents: 'true' }).catch(() => null)
      ]);
      setSpeakers(rRes?.data?.speakers || []);
      setAssignments(rRes?.data?.assignments || []);
      const evs = eRes?.data || [];
      setEvents(evs);
      const sessLists = await Promise.all(evs.map((e) => getSessionsByEvent(e._id).catch(() => null)));
      const all = [];
      sessLists.forEach((r, i) => (r?.data || []).forEach((s) => all.push({ ...s, eventName: evs[i].name })));
      setSessions(all);
    } catch (err) {
      setError(err.message || 'Failed to load speakers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const visibleAssignments = eventFilter
    ? assignments.filter((row) => (row.event?._id || row.event)?.toString() === eventFilter)
    : assignments;

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSpeakerForOrganizer({
        ...newSpeaker,
        expertise: newSpeaker.expertise.split(',').map((s) => s.trim()).filter(Boolean)
      });
      setSuccess(`Speaker "${newSpeaker.name}" added to your directory. You can now assign them to any of your event sessions.`);
      setAddOpen(false);
      setNewSpeaker({ name: '', designation: '', company: '', contactEmail: '', expertise: '' });
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to add speaker');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedSession = sessions.find((session) => session._id === assign.sessionId);
      const selectedSpeaker = speakers.find((speaker) => speaker._id === assign.speakerId);
      await assignSpeakerToSession(assign.sessionId, assign.speakerId);
      setSuccess(`${selectedSpeaker?.name || 'Speaker'} assigned to "${selectedSession?.title || 'session'}"${selectedSession?.eventName ? ` at ${selectedSession.eventName}` : ''}.`);
      setAssignOpen(false);
      setAssign({ eventId: '', sessionId: '', speakerId: '' });
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to assign speaker');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (sessionId, speakerId, speakerName) => {
    if (!window.confirm(`Remove "${speakerName}" from this session? (Their personal profile is untouched.)`)) return;
    try {
      await removeSpeakerFromSession(sessionId, speakerId);
      setSuccess('Speaker removed from session.');
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to remove speaker');
    }
  };

  if (loading) return <LoadingSpinner message="Loading speaker management..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mic2 style={{ width: '24px', height: '24px', color: '#a78bfa' }} /> Speaker Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Add speakers, assign them to sessions, and remove assignments across your events. Personal Speaker Hub profiles are never edited here.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}>
            <option value="">All my events</option>
            {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
          </select>
      <button onClick={() => { setAssign({ eventId: '', sessionId: '', speakerId: '' }); setAssignOpen(true); }} disabled={speakers.length === 0 || sessions.length === 0} style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: speakers.length === 0 || sessions.length === 0 ? 'not-allowed' : 'pointer', opacity: speakers.length === 0 || sessions.length === 0 ? 0.5 : 1 }}>
            Assign to Session
          </button>
          <button onClick={() => setAddOpen(true)} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus style={{ width: '15px', height: '15px' }} /> Add Speaker
          </button>
        </div>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {speakers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Your speaker directory is empty</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Add a speaker here first. They will then be available to assign to sessions in your events.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {speakers.map((sp) => {
            const speakerAssignments = visibleAssignments.filter((row) => row.speaker?._id?.toString() === sp._id?.toString());
            return (
            <div key={sp._id} className="glass-card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{sp.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {sp.designation}{sp.company ? ` · ${sp.company}` : ''}
              </div>
              {(sp.expertise || []).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {sp.expertise.slice(0, 3).map((t) => (
                    <span key={t} style={{ fontSize: '11px', backgroundColor: 'rgba(139,92,246,0.15)', color: '#c4b5fd', padding: '2px 10px', borderRadius: '20px' }}>{t}</span>
                  ))}
                </div>
              )}
              {speakerAssignments.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedSpeakerIds((current) => {
                      const next = new Set(current);
                      if (next.has(sp._id)) next.delete(sp._id);
                      else next.add(sp._id);
                      return next;
                    })}
                    aria-expanded={expandedSpeakerIds.has(sp._id)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#a5b4fc', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {expandedSpeakerIds.has(sp._id) ? 'Hide assignments' : `View event assignments (${speakerAssignments.length})`}
                  </button>
                  {expandedSpeakerIds.has(sp._id) && (
                    <div style={{ marginTop: '9px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {speakerAssignments.map((row) => (
                        <div key={`${row.session?._id}-${row.event?._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderRadius: '8px', padding: '8px', backgroundColor: 'rgba(15,23,42,0.65)' }}>
                          <Link to={`/events/${row.event?._id}`} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.event?.name}</span>
                            <span style={{ display: 'block', color: '#94a3b8', marginTop: '2px' }}>{row.session?.title}</span>
                          </Link>
                          <button onClick={() => handleRemove(row.session?._id, sp._id, sp.name)} aria-label={`Remove ${sp.name} from ${row.session?.title}`} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><UserX style={{ width: '15px', height: '15px' }} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {/* Add speaker modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Speaker">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input required value={newSpeaker.name} onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })} style={inputStyle} placeholder="Dr. Jane Smith" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Designation</label>
              <input value={newSpeaker.designation} onChange={(e) => setNewSpeaker({ ...newSpeaker, designation: e.target.value })} style={inputStyle} placeholder="CTO" />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input value={newSpeaker.company} onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })} style={inputStyle} placeholder="Acme Corp" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Contact Email</label>
            <input type="email" value={newSpeaker.contactEmail} onChange={(e) => setNewSpeaker({ ...newSpeaker, contactEmail: e.target.value })} style={inputStyle} placeholder="speaker@company.com" />
          </div>
          <div>
            <label style={labelStyle}>Expertise (comma-separated)</label>
            <input value={newSpeaker.expertise} onChange={(e) => setNewSpeaker({ ...newSpeaker, expertise: e.target.value })} style={inputStyle} placeholder="AI, Cloud, Security" />
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding…' : 'Add Speaker'}
          </button>
        </form>
      </Modal>

      {/* Assign modal */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Speaker to Session">
        <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Event *</label>
            <select required value={assign.eventId} onChange={(e) => setAssign({ ...assign, eventId: e.target.value, sessionId: '' })} style={{ ...inputStyle, backgroundColor: 'rgba(15,23,42,0.9)' }}>
              <option value="">Select event…</option>
              {events.map((event) => <option key={event._id} value={event._id}>{event.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Session *</label>
            <select required value={assign.sessionId} disabled={!assign.eventId} onChange={(e) => setAssign({ ...assign, sessionId: e.target.value })} style={{ ...inputStyle, backgroundColor: 'rgba(15,23,42,0.9)', opacity: assign.eventId ? 1 : 0.6 }}>
              <option value="">{assign.eventId ? 'Select session…' : 'Select an event first'}</option>
              {sessions.filter((session) => (session.event?._id || session.event)?.toString() === assign.eventId).map((s) => <option key={s._id} value={s._id}>{s.title} · {s.roomName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Speaker *</label>
            <select required value={assign.speakerId} onChange={(e) => setAssign({ ...assign, speakerId: e.target.value })} style={{ ...inputStyle, backgroundColor: 'rgba(15,23,42,0.9)' }}>
              <option value="">Select speaker…</option>
              {speakers.map((sp) => <option key={sp._id} value={sp._id}>{sp.name}{sp.company ? ` (${sp.company})` : ''}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Assigning…' : 'Assign Speaker'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
