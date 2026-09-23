import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyStaffShifts } from '../services/operationsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Calendar, MapPin, ScanLine } from 'lucide-react';

// Staff → My Events & Venue Operations: only events/shifts assigned to this staff member.
export default function StaffEvents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyStaffShifts();
        setShifts(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load assigned events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your assigned events..." />;

  // Group shifts by event
  const byEvent = new Map();
  shifts.forEach((s) => {
    const eid = (s.event?._id || s.event)?.toString?.() || 'unknown';
    if (!byEvent.has(eid)) byEvent.set(eid, { event: s.event, shifts: [] });
    byEvent.get(eid).shifts.push(s);
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar style={{ width: '24px', height: '24px', color: '#34d399' }} /> My Events & Venue Operations
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          {byEvent.size} assigned event{byEvent.size === 1 ? '' : 's'} · monitor your rooms and head to check-in.
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {byEvent.size === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No event assignments yet</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Your organizer will assign you to event shifts.</p>
        </div>
      ) : (
        [...byEvent.values()].map(({ event, shifts: evShifts }, i) => (
          <div key={event?._id || i} className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{event?.name || 'Event'}</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {evShifts.map((s) => (
                    <span key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin style={{ width: '13px', height: '13px' }} />
                      {s.assignedVenue?.name || 'Venue TBA'} · {s.role}
                      {s.shiftStart ? ` · ${new Date(s.shiftStart).toLocaleString()}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <Link to="/staff/check-in" style={{ backgroundColor: '#06b6d4', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ScanLine style={{ width: '15px', height: '15px' }} /> Open Check-in
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
