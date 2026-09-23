import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, updateEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import { Briefcase, Plus, BarChart3, Settings, CheckCircle2, XCircle } from 'lucide-react';

// Organizer → My Events: only events owned by the organizer.
// Entry point to per-event workspaces (sessions, speakers, sponsors, tickets,
// registrations, announcements, operations).
export default function OrganizerEvents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getEvents({ myEvents: 'true' });
        setEvents(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load your events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      await updateEvent(eventId, { status: newStatus });
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status: newStatus } : e));
    } catch (err) {
      setError(err.message || `Failed to ${newStatus.toLowerCase()} event`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your events..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase style={{ width: '24px', height: '24px', color: '#818cf8' }} /> My Events
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {events.length} event{events.length === 1 ? '' : 's'} you organize. Open a workspace to manage sessions, speakers, sponsors, tickets, registrations and announcements.
          </p>
        </div>
        <Link to="/organizer/events/new" style={{ backgroundColor: '#6366f1', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Plus style={{ width: '15px', height: '15px' }} /> Create Event
        </Link>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {events.length === 0 ? (
        <EmptyState title="No events yet" message="Create your first event to start managing sessions, speakers and tickets." icon={Briefcase} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {events.map((e) => (
            <div key={e._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{e.name}</h3>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', backgroundColor: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {e.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {e.startDate ? new Date(e.startDate).toLocaleDateString() : ''} · {e.venue?.name || 'No venue'} · Cap {e.capacity}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <Link to={`/events/${e._id}`} style={{ flex: 1, textAlign: 'center', backgroundColor: '#6366f1', color: '#fff', padding: '9px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Settings style={{ width: '14px', height: '14px' }} /> Manage Workspace
                </Link>
                <Link to={`/events/${e._id}/operations`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '9px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 style={{ width: '14px', height: '14px' }} /> Ops
                </Link>
              </div>
              {e.status !== 'Cancelled' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {e.status === 'Draft' && (
                    <button onClick={() => handleUpdateStatus(e._id, 'Published')} style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Publish
                    </button>
                  )}
                  {e.status === 'Published' && (
                    <button onClick={() => handleUpdateStatus(e._id, 'Draft')} style={{ flex: 1, backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                      Unpublish
                    </button>
                  )}
                  <button onClick={() => handleUpdateStatus(e._id, 'Cancelled')} style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                    <XCircle style={{ width: '14px', height: '14px' }} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
