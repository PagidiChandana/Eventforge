import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents, getAnnouncementsByEvent } from '../services/eventService';
import { getMyRegistrations } from '../services/registrationService';
import { getSpeakerSessions, getSponsorProfile } from '../services/modulesService';
import { getMyStaffShifts } from '../services/operationsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Megaphone } from 'lucide-react';
import { ROLES } from '../constants/roles';

// Role-aware announcement feed:
// Attendee → registered events; Speaker → own session events;
// Sponsor → own event(s); Organizer → own events (+ broadcast shortcut);
// Staff → shift events.
export default function AnnouncementsCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        let eventIds = [];
        if (user?.role === ROLES.ATTENDEE) {
          const res = await getMyRegistrations().catch(() => null);
          eventIds = (res?.data || []).map((r) => r.event?._id || r.event).filter(Boolean);
        } else if (user?.role === ROLES.SPEAKER) {
          const res = await getSpeakerSessions().catch(() => null);
          eventIds = (res?.data || []).map((s) => s.event?._id || s.event).filter(Boolean);
        } else if (user?.role === ROLES.EVENT_ORGANIZER) {
          const res = await getEvents({ myEvents: 'true' }).catch(() => null);
          eventIds = (res?.data || []).map((e) => e._id);
        } else if (user?.role === ROLES.EVENT_STAFF) {
          const res = await getMyStaffShifts().catch(() => null);
          eventIds = (res?.data || []).map((s) => s.event?._id || s.event).filter(Boolean);
        } else if (user?.role === ROLES.SPONSOR) {
          const res = await getSponsorProfile().catch(() => null);
          if (res?.data?.event) eventIds = [res.data.event?._id || res.data.event];
        }
        eventIds = [...new Set(eventIds.map((id) => id?.toString?.() || id))];

        const results = await Promise.all(
          eventIds.map(async (id) => ({
            id,
            anns: (await getAnnouncementsByEvent(id).catch(() => null))?.data || []
          }))
        );
        // Resolve event names
        const allEvents = await getEvents().catch(() => null);
        const nameById = Object.fromEntries((allEvents?.data || []).map((e) => [e._id.toString(), e.name]));
        setGroups(
          results.map((r) => ({ eventId: r.id, eventName: nameById[r.id?.toString?.()] || 'Event', announcements: r.anns }))
        );
      } catch (err) {
        setError(err.message || 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading announcements..." />;

  const total = groups.reduce((n, g) => n + g.announcements.length, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone style={{ width: '24px', height: '24px', color: '#fbbf24' }} /> Announcements
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>{total} update{total === 1 ? '' : 's'} across your events</p>
        </div>
        {user?.role === ROLES.EVENT_ORGANIZER && (
          <Link to="/organizer/events" style={{ backgroundColor: '#6366f1', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
            Broadcast from My Events
          </Link>
        )}
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {groups.length === 0 || total === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No announcements yet</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Updates from your events will appear here.</p>
        </div>
      ) : (
        groups.map((g) => (
          g.announcements.length > 0 && (
            <div key={g.eventId}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#a5b4fc', marginBottom: '10px' }}>{g.eventName}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {g.announcements.map((a) => (
                  <div key={a._id} className="glass-card" style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{a.title}</div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.5 }}>{a.message}</p>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                      {a.targetAudience ? `To: ${a.targetAudience} · ` : ''}{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}
    </div>
  );
}
