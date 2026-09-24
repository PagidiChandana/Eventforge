import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRegistrations, getMyTickets } from '../services/registrationService';
import { getEvents, getAnnouncementsByEvent } from '../services/eventService';
import { getMyAnalytics } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Calendar, Ticket, Sparkles, Megaphone, ArrowRight, Clock } from 'lucide-react';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [regRes, tickRes, evRes, analyticsRes] = await Promise.all([
          getMyRegistrations().catch(() => null),
          getMyTickets().catch(() => null),
          getEvents().catch(() => null),
          getMyAnalytics().catch(() => null)
        ]);
        setAnalytics(analyticsRes?.data || null);
        const regs = regRes?.data || [];
        setRegistrations(regs);
        setTickets(tickRes?.data || []);
        setEvents((evRes?.data || []).slice(0, 4));
        // Recent announcements across registered events
        const eventIds = [...new Set(regs.map((r) => r.event?._id || r.event).filter(Boolean))];
        const lists = await Promise.all(eventIds.map((id) => getAnnouncementsByEvent(id).catch(() => null)));
        const anns = [];
        lists.forEach((r) => (r?.data || []).forEach((a) => anns.push(a)));
        anns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(anns.slice(0, 4));
      } catch (err) {
        setError(err.message || 'Failed to load attendee dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your attendee dashboard..." />;

  const upcoming = registrations.filter((r) => r.status === 'Approved');
  const selectedCount = registrations.reduce((n, r) => n + (r.selectedSessions?.length || 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '26px 28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>
          Welcome back, <span style={{ background: 'linear-gradient(90deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name}</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
          Your events, tickets, schedule and AI picks — all in one place.
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Registered Events', value: upcoming.length, icon: <Calendar style={{ width: '20px', height: '20px', color: '#818cf8' }} />, to: '/attendee/registrations' },
          { label: 'My Tickets', value: tickets.length, icon: <Ticket style={{ width: '20px', height: '20px', color: '#34d399' }} />, to: '/attendee/tickets' },
          { label: 'Selected Sessions', value: selectedCount, icon: <Clock style={{ width: '20px', height: '20px', color: '#38bdf8' }} />, to: '/attendee/schedule' },
        ].map((c) => (
          <Link key={c.label} to={c.to} className="glass-card" style={{ padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{c.value}</div>
            </div>
            {c.icon}
          </Link>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>My participation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '12px' }}>
          {[
            ['Approved registrations', analytics?.registrations?.Approved],
            ['Pending registrations', analytics?.registrations?.Pending],
            ['Valid tickets', analytics?.tickets?.Valid],
            ['Used tickets', analytics?.tickets?.Used],
            ['Event check-ins', analytics?.checkIns],
            ['Session check-ins', analytics?.sessionCheckIns],
            ['Feedback submitted', analytics?.feedback?.count]
          ].map(([label, value]) => <div key={label} style={{ padding: '12px', background: 'rgba(15,23,42,.6)', borderRadius: '9px' }}><div style={{ color: '#94a3b8', fontSize: '11px' }}>{label}</div><div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{value || 0}</div></div>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Upcoming registered events */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>My Upcoming Events</h2>
            <Link to="/attendee/registrations" style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              No registrations yet. <Link to="/events" style={{ color: '#38bdf8' }}>Browse events</Link> to get started.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcoming.slice(0, 3).map((r) => (
                <Link key={r._id} to={`/events/${r.event?._id || r.event}`} style={{ textDecoration: 'none', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{r.event?.name || 'Event'}</span>
                  <ArrowRight style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Discover */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Discover Events</h2>
            <Link to="/events" style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>Catalog →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.map((e) => (
              <Link key={e._id} to={`/events/${e._id}`} style={{ textDecoration: 'none', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{e.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {e.startDate ? new Date(e.startDate).toLocaleDateString() : ''} · {e.venue?.name || e.venue?.city || 'TBA'}
                </div>
              </Link>
            ))}
            {events.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8' }}>No events published yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent announcements */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone style={{ width: '18px', height: '18px', color: '#fbbf24' }} /> Recent Announcements
          </h2>
          <Link to="/attendee/announcements" style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>View all →</Link>
        </div>
        {announcements.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No announcements from your events yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {announcements.map((a) => (
              <div key={a._id} style={{ backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{a.title}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{a.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
